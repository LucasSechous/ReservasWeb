-- Gestión de la reserva por link: el cliente cancela o reprograma su turno sin cuenta.
--
-- Reemplaza el esquema de la Fase 5 (token uuid guardado en claro + reserva_por_token + cancelar_reserva):
--   * El token ahora lo genera Next (32 bytes aleatorios, base64url) y en la base solo queda su sha256 en hex.
--   * Las funciones gestion_* las puede llamar solo service_role (el servidor de Next), nunca anon.
--   * Las reservas guardan quién y cuándo canceló, y cuántas veces se reprogramaron.
--
-- Esta migración BORRA la columna reservas.token_cancelacion y tres funciones (drop): la herramienta de
-- Supabase rechaza las sentencias destructivas, así que se aplica pegándola en el SQL Editor.
-- Las 2 reservas que hay hoy son de prueba; pierden su link de cancelación, nada más.
--
-- El EXCLUDE reservas_sin_superposicion se queda como está: ya es WHERE (estado = 'confirmada'), o sea que
-- una reserva cancelada nunca bloquea el horario (es más estricto que "estado <> 'cancelada'" y equivale a
-- él con los dos estados que existen).

-- 1. Columnas ---------------------------------------------------------------------------------
alter table public.reservas
  add column token_gestion_hash text,
  add column cancelada_at timestamptz,
  add column cancelada_por text,
  add column reprogramaciones int not null default 0;

alter table public.reservas
  add constraint reservas_token_gestion_hash_formato
    check (token_gestion_hash is null or token_gestion_hash ~ '^[0-9a-f]{64}$'),
  add constraint reservas_token_gestion_hash_unico unique (token_gestion_hash),
  add constraint reservas_cancelada_por_valido
    check (cancelada_por is null or cancelada_por in ('cliente', 'negocio')),
  add constraint reservas_reprogramaciones_valido check (reprogramaciones >= 0);

-- Las canceladas que ya existen conservan cuándo se tocaron por última vez; no se sabe quién las canceló.
update public.reservas set cancelada_at = updated_at where estado = 'cancelada' and cancelada_at is null;

alter table public.negocios
  add column horas_min_cambio int not null default 2
    check (horas_min_cambio >= 0);

-- 2. Cualquier cancelación deja constancia ------------------------------------------------------
-- El panel del negocio cancela con un update común; este trigger completa cuándo y por quién.
-- gestion_cancelar_reserva ya los manda explícitos ('cliente').
create function private.marcar_cancelacion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $f$
begin
  new.cancelada_at := coalesce(new.cancelada_at, now());
  new.cancelada_por := coalesce(new.cancelada_por, 'negocio');
  return new;
end;
$f$;

revoke execute on function private.marcar_cancelacion() from public, anon, authenticated;

create trigger trg_marcar_cancelacion
  before update on public.reservas
  for each row
  when (old.estado is distinct from 'cancelada' and new.estado = 'cancelada')
  execute function private.marcar_cancelacion();

-- 3. Fuera lo viejo ---------------------------------------------------------------------------
drop function public.reserva_por_token(uuid);
drop function public.cancelar_reserva(uuid);
drop function public.reservar(uuid, uuid, uuid, timestamptz, text, text, text, text);
alter table public.reservas drop column token_cancelacion;

-- 4. reservar(): igual que antes, pero guarda el hash del token que genera Next -----------------
-- Ya no devuelve el token. El hash es obligatorio: sin él la reserva no tendría link de gestión.
create function public.reservar(
  p_negocio_id uuid,
  p_servicio_id uuid,
  p_profesional_id uuid,
  p_inicio timestamptz,
  p_cliente_nombre text,
  p_cliente_telefono text,
  p_cliente_email text,
  p_notas text,
  p_token_gestion_hash text
)
returns table (
  reserva_id uuid,
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
  if p_token_gestion_hash is null or p_token_gestion_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'TOKEN_INVALIDO' using errcode = 'P0001';
  end if;

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
        rango, estado, origen, notas, precio_final, duracion_final_minutos,
        token_gestion_hash
      ) values (
        v_neg.id, v_prof, v_srv.id,
        v_nombre, v_tel, v_email,
        tstzrange(p_inicio, v_fin, '[)'), 'confirmada', 'publico',
        nullif(btrim(coalesce(p_notas, '')), ''), v_srv.precio, v_srv.duracion_minutos,
        p_token_gestion_hash
      )
      returning * into v_res;

      return query select v_res.id, v_res.profesional_id, lower(v_res.rango), upper(v_res.rango);
      return;
    exception when exclusion_violation then
      null; -- ese profesional ya está ocupado: prueba con el siguiente
    end;
  end loop;

  raise exception 'HORARIO_NO_DISPONIBLE' using errcode = 'P0001';
end;
$f$;

revoke execute on function public.reservar(uuid, uuid, uuid, timestamptz, text, text, text, text, text) from public;
grant execute on function public.reservar(uuid, uuid, uuid, timestamptz, text, text, text, text, text) to anon, authenticated;

-- 5. gestion_obtener_reserva ------------------------------------------------------------------
-- Devuelve la reserva de ese token y qué se puede hacer con ella. Sin fila = token desconocido.
-- p_max_reprogramaciones lo manda Next (una sola constante en el código).
-- No devuelve el teléfono del cliente.
create function public.gestion_obtener_reserva(p_token_hash text, p_max_reprogramaciones int)
returns table (
  reserva_id uuid,
  negocio_id uuid,
  negocio_slug text,
  negocio_nombre text,
  negocio_telefono text,
  negocio_email text,
  negocio_direccion text,
  timezone text,
  servicio_id uuid,
  servicio_nombre text,
  profesional_id uuid,
  profesional_nombre text,
  cliente_nombre text,
  cliente_email text,
  inicio timestamptz,
  fin timestamptz,
  estado text,
  precio_final numeric,
  reprogramaciones int,
  horas_min_cambio int,
  puede_cancelar boolean,
  puede_reprogramar boolean,
  motivo text
)
language sql
stable
security definer
set search_path = ''
as $f$
  select r.id,
         n.id,
         n.slug::text,
         n.nombre::text,
         n.telefono::text,
         n.email::text,
         n.direccion::text,
         n.timezone::text,
         r.servicio_id,
         s.nombre::text,
         r.profesional_id,
         p.nombre::text,
         r.cliente_nombre::text,
         r.cliente_email::text,
         lower(r.rango),
         upper(r.rango),
         r.estado::text,
         r.precio_final,
         r.reprogramaciones,
         n.horas_min_cambio,
         c.abierta,
         c.abierta and r.reprogramaciones < p_max_reprogramaciones and r.servicio_id is not null,
         case
           when r.estado = 'cancelada' then 'CANCELADA'
           when lower(r.rango) <= now() then 'YA_PASO'
           when not c.abierta then 'FUERA_DE_VENTANA'
           when r.reprogramaciones >= p_max_reprogramaciones then 'LIMITE_REPROGRAMACIONES'
         end
  from public.reservas r
  join public.negocios n on n.id = r.negocio_id
  join public.profesionales p on p.id = r.profesional_id
  left join public.servicios s on s.id = r.servicio_id
  cross join lateral (
    select r.estado = 'confirmada'
       and lower(r.rango) - make_interval(hours => n.horas_min_cambio) >= now() as abierta
  ) c
  where r.token_gestion_hash = p_token_hash
    and r.origen = 'publico'
$f$;

-- 6. gestion_cancelar_reserva -----------------------------------------------------------------
-- Idempotente: si ya estaba cancelada devuelve el estado actual, sin error.
-- Errores (mensaje en mayúsculas, como reservar()): NO_EXISTE, YA_PASO, FUERA_DE_VENTANA.
create function public.gestion_cancelar_reserva(p_token_hash text)
returns table (
  reserva_id uuid,
  negocio_id uuid,
  negocio_slug text,
  negocio_nombre text,
  negocio_telefono text,
  negocio_email text,
  negocio_direccion text,
  timezone text,
  servicio_id uuid,
  servicio_nombre text,
  profesional_id uuid,
  profesional_nombre text,
  cliente_nombre text,
  cliente_email text,
  inicio timestamptz,
  fin timestamptz,
  estado text,
  precio_final numeric,
  reprogramaciones int,
  horas_min_cambio int,
  puede_cancelar boolean,
  puede_reprogramar boolean,
  motivo text
)
language plpgsql
security definer
set search_path = ''
as $f$
declare
  v_res public.reservas%rowtype;
  v_horas int;
begin
  select r.* into v_res
  from public.reservas r
  where r.token_gestion_hash = p_token_hash and r.origen = 'publico'
  for update;
  if not found then raise exception 'NO_EXISTE' using errcode = 'P0001'; end if;

  if v_res.estado <> 'cancelada' then
    select n.horas_min_cambio into v_horas from public.negocios n where n.id = v_res.negocio_id;

    if v_res.estado <> 'confirmada' or lower(v_res.rango) <= now() then
      raise exception 'YA_PASO' using errcode = 'P0001';
    end if;
    if lower(v_res.rango) - make_interval(hours => v_horas) < now() then
      raise exception 'FUERA_DE_VENTANA' using errcode = 'P0001';
    end if;

    update public.reservas r
       set estado = 'cancelada', cancelada_at = now(), cancelada_por = 'cliente'
     where r.id = v_res.id;
  end if;

  return query select * from public.gestion_obtener_reserva(p_token_hash, 0);
end;
$f$;

-- 7. gestion_reprogramar_reserva ----------------------------------------------------------------
-- Mueve la MISMA reserva a otro horario (mismo servicio y mismo precio_final). Si no se pasa profesional,
-- queda el mismo. El horario se valida con horarios_libres(): una sola lógica de disponibilidad.
-- Errores: NO_EXISTE, YA_CANCELADA, YA_PASO, FUERA_DE_VENTANA, LIMITE_REPROGRAMACIONES,
--          SERVICIO_NO_DISPONIBLE, MISMO_HORARIO, HORARIO_NO_DISPONIBLE (incluye la carrera 23P01).
create function public.gestion_reprogramar_reserva(
  p_token_hash text,
  p_inicio timestamptz,
  p_max_reprogramaciones int,
  p_profesional_id uuid default null
)
returns table (
  reserva_id uuid,
  negocio_id uuid,
  negocio_slug text,
  negocio_nombre text,
  negocio_telefono text,
  negocio_email text,
  negocio_direccion text,
  timezone text,
  servicio_id uuid,
  servicio_nombre text,
  profesional_id uuid,
  profesional_nombre text,
  cliente_nombre text,
  cliente_email text,
  inicio timestamptz,
  fin timestamptz,
  estado text,
  precio_final numeric,
  reprogramaciones int,
  horas_min_cambio int,
  puede_cancelar boolean,
  puede_reprogramar boolean,
  motivo text
)
language plpgsql
security definer
set search_path = ''
as $f$
declare
  v_res   public.reservas%rowtype;
  v_neg   public.negocios%rowtype;
  v_prof  uuid;
  v_turno record;
begin
  select r.* into v_res
  from public.reservas r
  where r.token_gestion_hash = p_token_hash and r.origen = 'publico'
  for update;
  if not found then raise exception 'NO_EXISTE' using errcode = 'P0001'; end if;

  if v_res.estado = 'cancelada' then raise exception 'YA_CANCELADA' using errcode = 'P0001'; end if;
  if v_res.estado <> 'confirmada' or lower(v_res.rango) <= now() then
    raise exception 'YA_PASO' using errcode = 'P0001';
  end if;

  select * into v_neg from public.negocios n where n.id = v_res.negocio_id;
  if lower(v_res.rango) - make_interval(hours => v_neg.horas_min_cambio) < now() then
    raise exception 'FUERA_DE_VENTANA' using errcode = 'P0001';
  end if;
  if v_res.reprogramaciones >= p_max_reprogramaciones then
    raise exception 'LIMITE_REPROGRAMACIONES' using errcode = 'P0001';
  end if;
  if v_res.servicio_id is null then
    raise exception 'SERVICIO_NO_DISPONIBLE' using errcode = 'P0001';
  end if;
  if p_inicio is null then raise exception 'FECHA_INVALIDA' using errcode = 'P0001'; end if;

  v_prof := coalesce(p_profesional_id, v_res.profesional_id);
  if v_prof = v_res.profesional_id and p_inicio = lower(v_res.rango) then
    raise exception 'MISMO_HORARIO' using errcode = 'P0001';
  end if;

  -- El horario tiene que estar entre los libres que calcula el motor de disponibilidad.
  select hl.inicio, hl.fin into v_turno
  from public.horarios_libres(
         v_res.negocio_id, v_res.servicio_id, (p_inicio at time zone v_neg.timezone)::date, v_prof
       ) hl
  where hl.profesional_id = v_prof and hl.inicio = p_inicio;
  if not found then raise exception 'HORARIO_NO_DISPONIBLE' using errcode = 'P0001'; end if;

  begin
    update public.reservas r
       set rango = tstzrange(v_turno.inicio, v_turno.fin, '[)'),
           profesional_id = v_prof,
           duracion_final_minutos = (extract(epoch from (v_turno.fin - v_turno.inicio)) / 60)::int,
           reprogramaciones = r.reprogramaciones + 1
     where r.id = v_res.id;
  exception when exclusion_violation then
    -- Otro cliente ganó el horario entre la consulta y el update.
    raise exception 'HORARIO_NO_DISPONIBLE' using errcode = 'P0001';
  end;

  return query select * from public.gestion_obtener_reserva(p_token_hash, p_max_reprogramaciones);
end;
$f$;

-- 8. Permisos: las tres, solo service_role -------------------------------------------------------
revoke execute on function public.gestion_obtener_reserva(text, int) from public, anon, authenticated;
revoke execute on function public.gestion_cancelar_reserva(text) from public, anon, authenticated;
revoke execute on function public.gestion_reprogramar_reserva(text, timestamptz, int, uuid) from public, anon, authenticated;

grant execute on function public.gestion_obtener_reserva(text, int) to service_role;
grant execute on function public.gestion_cancelar_reserva(text) to service_role;
grant execute on function public.gestion_reprogramar_reserva(text, timestamptz, int, uuid) to service_role;
