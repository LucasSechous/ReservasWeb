-- Fase 2: ajusta el esquema del intento anterior al diseño de docs/plan-v1.md.
-- Requiere las 9 tablas VACÍAS (se borraron los datos de prueba el 28 de octubre de 2026):
-- si alguna tiene filas, el ALTER de `reservas` falla y no se aplica nada.

-- 1. Lo que sobra ---------------------------------------------------------------
drop table public.resenas;

alter table public.negocios
  drop column plan,
  drop column buffer_minutos,
  drop column descripcion,
  drop column logo_url;

-- 2. reservas: de fecha + horas sin zona a un rango en timestamptz ------------------
alter table public.reservas
  drop constraint reservas_profesional_id_tsrange_excl;

alter table public.reservas
  drop column fecha,
  drop column hora_inicio,
  drop column hora_fin;

alter table public.reservas
  add column rango tstzrange not null;

alter table public.reservas
  add constraint reservas_rango_valido check (
    not isempty(rango)
    and not lower_inf(rango)
    and not upper_inf(rango)
    and lower_inc(rango)
    and not upper_inc(rango)
  ),
  -- Doble reserva imposible: un profesional no puede tener dos turnos confirmados superpuestos.
  add constraint reservas_sin_superposicion exclude using gist (
    profesional_id with =,
    rango with &&
  ) where (estado = 'confirmada');

create index idx_reservas_negocio_rango on public.reservas using gist (negocio_id, rango);

-- 3. usuarios: el operador no pertenece a ningún negocio ---------------------------
alter table public.usuarios alter column negocio_id drop not null;

alter table public.usuarios
  add constraint usuarios_negocio_segun_rol check (
    (rol = 'admin_plataforma' and negocio_id is null)
    or (rol <> 'admin_plataforma' and negocio_id is not null)
  );

-- 4. Funciones auxiliares fuera del esquema expuesto por la API --------------------
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

alter function public.auth_negocio_id() set schema private;
revoke execute on function private.auth_negocio_id() from public, anon;
grant execute on function private.auth_negocio_id() to authenticated;

create function private.es_operador()
returns boolean
language sql
stable
security definer
set search_path = ''
as $f$
  select exists (
    select 1
    from public.usuarios u
    where u.auth_user_id = (select auth.uid())
      and u.rol = 'admin_plataforma'
      and u.activo
  )
$f$;

revoke execute on function private.es_operador() from public, anon;
grant execute on function private.es_operador() to authenticated;

-- El operador (vos) ve y edita todo.
do $p$
declare
  t text;
begin
  foreach t in array array[
    'negocios', 'servicios', 'profesionales', 'profesional_servicios',
    'horarios_disponibles', 'horarios_excepciones', 'reservas', 'usuarios'
  ] loop
    execute format(
      'create policy %I on public.%I for all to authenticated
         using ((select private.es_operador()))
         with check ((select private.es_operador()))',
      t || '_operador', t
    );
  end loop;
end
$p$;

-- 5. reservar() y cancelar_reserva() con el nuevo rango -----------------------------
drop function public.reservar(uuid, uuid, uuid, date, time without time zone, text, text, text, text);
drop function public.cancelar_reserva(uuid);

create function public.reservar(
  p_negocio_id uuid,
  p_servicio_id uuid,
  p_profesional_id uuid,
  p_inicio timestamptz,
  p_cliente_nombre text,
  p_cliente_telefono text,
  p_cliente_email text default null,
  p_notas text default null
)
returns table (
  reserva_id uuid,
  token_cancelacion uuid,
  profesional_id uuid,
  inicio timestamptz,
  fin timestamptz
)
language plpgsql
security definer
set search_path = ''
as $f$
declare
  v_neg       public.negocios%rowtype;
  v_srv       public.servicios%rowtype;
  v_fin       timestamptz;
  v_local_ini timestamp;
  v_local_fin timestamp;
  v_fecha     date;
  v_prof      uuid;
  v_res       public.reservas%rowtype;
  v_nombre    text := btrim(coalesce(p_cliente_nombre, ''));
  v_tel       text := btrim(coalesce(p_cliente_telefono, ''));
  v_email     text := nullif(btrim(coalesce(p_cliente_email, '')), '');
begin
  select * into v_neg from public.negocios n where n.id = p_negocio_id and n.activo;
  if not found then raise exception 'NEGOCIO_NO_DISPONIBLE' using errcode = 'P0001'; end if;

  select * into v_srv from public.servicios s
  where s.id = p_servicio_id and s.negocio_id = v_neg.id and s.activo;
  if not found then raise exception 'SERVICIO_NO_DISPONIBLE' using errcode = 'P0001'; end if;

  if length(v_nombre) < 2 or length(v_nombre) > 100 then
    raise exception 'NOMBRE_INVALIDO' using errcode = 'P0001';
  end if;
  if v_tel !~ '^\+?[0-9 ()-]{6,20}$' then
    raise exception 'TELEFONO_INVALIDO' using errcode = 'P0001';
  end if;
  if v_email is not null and v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'EMAIL_INVALIDO' using errcode = 'P0001';
  end if;
  if p_inicio is null then raise exception 'FECHA_INVALIDA' using errcode = 'P0001'; end if;

  v_fin       := p_inicio + make_interval(mins => v_srv.duracion_minutos);
  v_local_ini := p_inicio at time zone v_neg.timezone;
  v_local_fin := v_fin at time zone v_neg.timezone;
  v_fecha     := v_local_ini::date;

  -- El turno tiene que empezar y terminar el mismo día, en hora del negocio.
  if v_local_fin::date <> v_fecha then
    raise exception 'FUERA_DE_HORARIO' using errcode = 'P0001';
  end if;
  if p_inicio < now() + make_interval(mins => v_neg.anticipacion_minutos) then
    raise exception 'ANTICIPACION_INSUFICIENTE' using errcode = 'P0001';
  end if;
  if v_fecha > (now() at time zone v_neg.timezone)::date + v_neg.ventana_dias then
    raise exception 'FUERA_DE_VENTANA' using errcode = 'P0001';
  end if;

  -- Prueba con cada profesional que haga el servicio (o solo con el pedido) y se queda con el primero libre.
  for v_prof in
    select pr.id
    from public.profesionales pr
    join public.profesional_servicios ps
      on ps.profesional_id = pr.id and ps.servicio_id = v_srv.id
    where pr.negocio_id = v_neg.id
      and pr.activo
      and (p_profesional_id is null or pr.id = p_profesional_id)
      and (
        case
          when exists (select 1 from public.horarios_excepciones e
                       where e.profesional_id = pr.id and e.fecha = v_fecha) then
            exists (select 1 from public.horarios_excepciones e
                    where e.profesional_id = pr.id and e.fecha = v_fecha
                      and e.disponible
                      and e.hora_inicio <= v_local_ini::time
                      and e.hora_fin >= v_local_fin::time)
          else
            exists (select 1 from public.horarios_disponibles h
                    where h.profesional_id = pr.id
                      and h.dia_semana = extract(dow from v_fecha)::smallint
                      and h.hora_inicio <= v_local_ini::time
                      and h.hora_fin >= v_local_fin::time)
        end
      )
    order by pr.created_at, pr.id
  loop
    begin
      insert into public.reservas (
        negocio_id, profesional_id, servicio_id,
        cliente_nombre, cliente_telefono, cliente_email,
        rango, estado, origen, notas, precio_final, duracion_final_minutos
      ) values (
        v_neg.id, v_prof, v_srv.id,
        v_nombre, v_tel, v_email,
        tstzrange(p_inicio, v_fin, '[)'), 'confirmada', 'publico',
        nullif(btrim(coalesce(p_notas, '')), ''), v_srv.precio, v_srv.duracion_minutos
      )
      returning * into v_res;

      return query select v_res.id, v_res.token_cancelacion, v_res.profesional_id,
                          lower(v_res.rango), upper(v_res.rango);
      return;
    exception when exclusion_violation then
      null; -- ese profesional ya está ocupado: prueba con el siguiente
    end;
  end loop;

  raise exception 'HORARIO_NO_DISPONIBLE' using errcode = 'P0001';
end;
$f$;

create function public.cancelar_reserva(p_token uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $f$
declare
  v_id uuid;
begin
  update public.reservas r
     set estado = 'cancelada'
   where r.token_cancelacion = p_token
     and r.estado = 'confirmada'
     and r.origen = 'publico'
     and lower(r.rango) > now()
  returning r.id into v_id;

  return v_id is not null;
end;
$f$;

-- Estas dos son la entrada pública: las puede llamar cualquiera.
revoke execute on function public.reservar(uuid, uuid, uuid, timestamptz, text, text, text, text) from public;
revoke execute on function public.cancelar_reserva(uuid) from public;
grant execute on function public.reservar(uuid, uuid, uuid, timestamptz, text, text, text, text) to anon, authenticated;
grant execute on function public.cancelar_reserva(uuid) to anon, authenticated;

-- 6. Permisos mínimos sobre las tablas ------------------------------------------------
-- Antes anon y authenticated tenían todos los permisos (hasta TRUNCATE) y solo la RLS los frenaba.
revoke all on all tables in schema public from anon, authenticated;

-- El público solo lee lo que muestra la landing. Las reservas pasan siempre por reservar().
grant select on
  public.negocios, public.servicios, public.profesionales,
  public.profesional_servicios, public.horarios_disponibles, public.horarios_excepciones
to anon;

-- Quien tiene sesión: lo que le permitan las políticas RLS.
grant select, insert, update, delete on
  public.negocios, public.servicios, public.profesionales,
  public.profesional_servicios, public.horarios_disponibles, public.horarios_excepciones,
  public.reservas, public.usuarios
to authenticated;
