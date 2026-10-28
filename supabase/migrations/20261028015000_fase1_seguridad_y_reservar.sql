-- Fase 1: cierre de agujeros de RLS, aislamiento entre negocios, reservar() y cancelar_reserva().
-- Convenciones:
--   * Fechas y horas de reservas en hora LOCAL del negocio (date + time); negocios.timezone define la zona.
--   * horarios_disponibles.dia_semana: 0 = domingo ... 6 = sábado (EXTRACT(dow)).
--   * El público nunca escribe tablas: solo llama a reservar() y cancelar_reserva().


-- 1. Limpieza ----------------------------------------------------------------
drop table if exists public._prisma_migrations;

alter extension btree_gist set schema extensions;

revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- 2. Helper de tenant con search_path fijo y sin acceso anónimo ---------------
create or replace function public.auth_negocio_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select u.negocio_id
  from public.usuarios u
  where u.auth_user_id = auth.uid() and u.activo = true
$$;

revoke execute on function public.auth_negocio_id() from public, anon;
grant execute on function public.auth_negocio_id() to authenticated;

-- 3. Columnas nuevas ----------------------------------------------------------
alter table public.negocios
  add column if not exists anticipacion_minutos integer not null default 60
    check (anticipacion_minutos >= 0),
  add column if not exists ventana_dias integer not null default 30
    check (ventana_dias between 1 and 365);

alter table public.reservas
  add column if not exists token_cancelacion uuid not null default gen_random_uuid();

alter table public.reservas
  add constraint reservas_token_cancelacion_key unique (token_cancelacion);

-- 4. Aislamiento entre negocios a nivel de claves -----------------------------
alter table public.profesionales add constraint profesionales_id_negocio_key unique (id, negocio_id);
alter table public.servicios     add constraint servicios_id_negocio_key     unique (id, negocio_id);

alter table public.reservas
  add constraint reservas_profesional_mismo_negocio_fkey
    foreign key (profesional_id, negocio_id) references public.profesionales (id, negocio_id),
  add constraint reservas_servicio_mismo_negocio_fkey
    foreign key (servicio_id, negocio_id) references public.servicios (id, negocio_id);

-- 5. Políticas RLS: se rehacen todas ------------------------------------------
do $$
declare p record;
begin
  for p in select policyname, tablename from pg_policies where schemaname = 'public' loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

-- negocios: lectura pública de activos; el dueño ve el suyo. Sin escritura (la hace el operador).
create policy negocios_select_public on public.negocios
  for select to anon, authenticated using (activo = true);
create policy negocios_select_owner on public.negocios
  for select to authenticated using (id = public.auth_negocio_id());

-- usuarios: cada uno solo lee su fila. Altas y cambios, solo el operador.
create policy usuarios_select_self on public.usuarios
  for select to authenticated using (auth_user_id = auth.uid());

-- servicios
create policy servicios_select_public on public.servicios
  for select to anon, authenticated using (activo = true);
create policy servicios_owner on public.servicios
  for all to authenticated
  using (negocio_id = public.auth_negocio_id())
  with check (negocio_id = public.auth_negocio_id());

-- profesionales
create policy profesionales_select_public on public.profesionales
  for select to anon, authenticated using (activo = true);
create policy profesionales_owner on public.profesionales
  for all to authenticated
  using (negocio_id = public.auth_negocio_id())
  with check (negocio_id = public.auth_negocio_id());

-- profesional_servicios
create policy prof_serv_select_public on public.profesional_servicios
  for select to anon, authenticated using (true);
create policy prof_serv_owner on public.profesional_servicios
  for all to authenticated
  using (profesional_id in (select id from public.profesionales where negocio_id = public.auth_negocio_id()))
  with check (
    profesional_id in (select id from public.profesionales where negocio_id = public.auth_negocio_id())
    and servicio_id in (select id from public.servicios where negocio_id = public.auth_negocio_id())
  );

-- horarios_disponibles
create policy horarios_disp_select_public on public.horarios_disponibles
  for select to anon, authenticated using (true);
create policy horarios_disp_owner on public.horarios_disponibles
  for all to authenticated
  using (profesional_id in (select id from public.profesionales where negocio_id = public.auth_negocio_id()))
  with check (profesional_id in (select id from public.profesionales where negocio_id = public.auth_negocio_id()));

-- horarios_excepciones
create policy horarios_exc_select_public on public.horarios_excepciones
  for select to anon, authenticated using (true);
create policy horarios_exc_owner on public.horarios_excepciones
  for all to authenticated
  using (profesional_id in (select id from public.profesionales where negocio_id = public.auth_negocio_id()))
  with check (profesional_id in (select id from public.profesionales where negocio_id = public.auth_negocio_id()));

-- reservas: el público no las ve ni las escribe. El dueño las ve, carga manuales/bloqueos y las actualiza (cancelar).
create policy reservas_select_owner on public.reservas
  for select to authenticated using (negocio_id = public.auth_negocio_id());
create policy reservas_insert_owner on public.reservas
  for insert to authenticated
  with check (negocio_id = public.auth_negocio_id() and origen in ('manual', 'bloqueo'));
create policy reservas_update_owner on public.reservas
  for update to authenticated
  using (negocio_id = public.auth_negocio_id())
  with check (negocio_id = public.auth_negocio_id());

-- resenas: fuera de la v1; solo lectura de publicadas y gestión del dueño.
create policy resenas_select_public on public.resenas
  for select to anon, authenticated using (publicada = true);
create policy resenas_owner on public.resenas
  for all to authenticated
  using (negocio_id = public.auth_negocio_id())
  with check (negocio_id = public.auth_negocio_id());

-- 6. reservar() -----------------------------------------------------------------
create or replace function public.reservar(
  p_negocio_id        uuid,
  p_servicio_id       uuid,
  p_profesional_id    uuid,      -- null = cualquier profesional disponible
  p_fecha             date,
  p_hora_inicio       time,
  p_cliente_nombre    text,
  p_cliente_telefono  text,
  p_cliente_email     text default null,
  p_notas             text default null
)
returns table (
  reserva_id        uuid,
  token_cancelacion uuid,
  profesional_id    uuid,
  fecha             date,
  hora_inicio       time,
  hora_fin          time
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_neg    public.negocios%rowtype;
  v_srv    public.servicios%rowtype;
  v_ahora  timestamp;
  v_inicio timestamp;
  v_fin    timestamp;
  v_hfin   time;
  v_prof   uuid;
  v_res    public.reservas%rowtype;
  v_nombre text := btrim(coalesce(p_cliente_nombre, ''));
  v_tel    text := btrim(coalesce(p_cliente_telefono, ''));
  v_email  text := nullif(btrim(coalesce(p_cliente_email, '')), '');
begin
  -- Negocio y servicio
  select * into v_neg from public.negocios n where n.id = p_negocio_id and n.activo;
  if not found then raise exception 'NEGOCIO_NO_DISPONIBLE' using errcode = 'P0001'; end if;

  select * into v_srv from public.servicios s
  where s.id = p_servicio_id and s.negocio_id = v_neg.id and s.activo;
  if not found then raise exception 'SERVICIO_NO_DISPONIBLE' using errcode = 'P0001'; end if;

  -- Datos del cliente
  if length(v_nombre) < 2 or length(v_nombre) > 100 then
    raise exception 'NOMBRE_INVALIDO' using errcode = 'P0001';
  end if;
  if v_tel !~ '^\+?[0-9 ()-]{6,20}$' then
    raise exception 'TELEFONO_INVALIDO' using errcode = 'P0001';
  end if;
  if v_email is not null and v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'EMAIL_INVALIDO' using errcode = 'P0001';
  end if;

  -- Tiempo, en la zona del negocio
  v_inicio := p_fecha + p_hora_inicio;
  v_fin    := v_inicio + make_interval(mins => v_srv.duracion_minutos);
  if v_fin::date <> p_fecha then
    raise exception 'FUERA_DE_HORARIO' using errcode = 'P0001';
  end if;
  v_hfin  := v_fin::time;
  v_ahora := now() at time zone v_neg.timezone;

  if v_inicio < v_ahora + make_interval(mins => v_neg.anticipacion_minutos) then
    raise exception 'ANTICIPACION_INSUFICIENTE' using errcode = 'P0001';
  end if;
  if p_fecha > v_ahora::date + v_neg.ventana_dias then
    raise exception 'FUERA_DE_VENTANA' using errcode = 'P0001';
  end if;

  -- Profesionales candidatos: activos, del negocio, que hacen el servicio y atienden en ese horario
  for v_prof in
    select pr.id
    from public.profesionales pr
    join public.profesional_servicios ps on ps.profesional_id = pr.id and ps.servicio_id = v_srv.id
    where pr.negocio_id = v_neg.id
      and pr.activo
      and (p_profesional_id is null or pr.id = p_profesional_id)
      and (
        case
          when exists (select 1 from public.horarios_excepciones e
                       where e.profesional_id = pr.id and e.fecha = p_fecha) then
            exists (select 1 from public.horarios_excepciones e
                    where e.profesional_id = pr.id and e.fecha = p_fecha
                      and e.disponible
                      and e.hora_inicio <= p_hora_inicio and e.hora_fin >= v_hfin)
          else
            exists (select 1 from public.horarios_disponibles h
                    where h.profesional_id = pr.id
                      and h.dia_semana = extract(dow from p_fecha)::smallint
                      and h.hora_inicio <= p_hora_inicio and h.hora_fin >= v_hfin)
        end
      )
    order by pr.created_at, pr.id
  loop
    begin
      insert into public.reservas (
        negocio_id, profesional_id, servicio_id,
        cliente_nombre, cliente_telefono, cliente_email,
        fecha, hora_inicio, hora_fin,
        estado, origen, notas, precio_final, duracion_final_minutos
      ) values (
        v_neg.id, v_prof, v_srv.id,
        v_nombre, v_tel, v_email,
        p_fecha, p_hora_inicio, v_hfin,
        'confirmada', 'publico', nullif(btrim(coalesce(p_notas, '')), ''), v_srv.precio, v_srv.duracion_minutos
      )
      returning * into v_res;

      return query select v_res.id, v_res.token_cancelacion, v_res.profesional_id,
                          v_res.fecha, v_res.hora_inicio, v_res.hora_fin;
      return;
    exception when exclusion_violation then
      -- Ese profesional ya está ocupado: probar el siguiente
      null;
    end;
  end loop;

  raise exception 'HORARIO_NO_DISPONIBLE' using errcode = 'P0001';
end;
$$;

revoke execute on function public.reservar(uuid, uuid, uuid, date, time, text, text, text, text) from public;
grant execute on function public.reservar(uuid, uuid, uuid, date, time, text, text, text, text) to anon, authenticated;

-- 7. cancelar_reserva() --------------------------------------------------------
create or replace function public.cancelar_reserva(p_token uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  update public.reservas r
     set estado = 'cancelada'
    from public.negocios n
   where r.token_cancelacion = p_token
     and n.id = r.negocio_id
     and r.estado = 'confirmada'
     and r.origen = 'publico'
     and (r.fecha + r.hora_inicio) > (now() at time zone n.timezone)
  returning r.id into v_id;

  return v_id is not null;
end;
$$;

revoke execute on function public.cancelar_reserva(uuid) from public;
grant execute on function public.cancelar_reserva(uuid) to anon, authenticated;

