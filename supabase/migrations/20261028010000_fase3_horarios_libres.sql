-- Fase 3: horarios libres por profesional. Solo suma una función; no cambia nada existente.
--
-- horarios_libres(negocio, servicio, día [, profesional]) devuelve, por profesional, los turnos
-- que se pueden reservar ese día, cortados cada 15 minutos y donde entra la duración completa del servicio.
--   1. Toma la excepción de esa fecha si existe (feriado = sin turnos; o un horario especial).
--      Si no, el horario semanal del día, que puede tener varios tramos (horario partido).
--   2. Resta las reservas confirmadas y los bloqueos (reservas con origen 'bloqueo').
--   3. Saca los que no cumplen la anticipación mínima o caen fuera de la ventana de días.
-- Es security definer porque quien consulta (el público) no puede leer la tabla reservas.
create function public.horarios_libres(
  p_negocio_id uuid,
  p_servicio_id uuid,
  p_fecha date,
  p_profesional_id uuid default null
)
returns table (
  profesional_id uuid,
  inicio timestamptz,
  fin timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $f$
declare
  v_neg public.negocios%rowtype;
  v_srv public.servicios%rowtype;
  v_hoy date;
begin
  select * into v_neg from public.negocios n where n.id = p_negocio_id and n.activo;
  if not found then return; end if;

  select * into v_srv from public.servicios s
  where s.id = p_servicio_id and s.negocio_id = v_neg.id and s.activo;
  if not found then return; end if;

  v_hoy := (now() at time zone v_neg.timezone)::date;
  if p_fecha is null or p_fecha < v_hoy or p_fecha > v_hoy + v_neg.ventana_dias then
    return;
  end if;

  return query
  with pros as (
    select pr.id
    from public.profesionales pr
    join public.profesional_servicios ps
      on ps.profesional_id = pr.id and ps.servicio_id = v_srv.id
    where pr.negocio_id = v_neg.id
      and pr.activo
      and (p_profesional_id is null or pr.id = p_profesional_id)
  ),
  tramos as (
    select p.id as prof_id, e.hora_inicio as desde, e.hora_fin as hasta
    from pros p
    join public.horarios_excepciones e
      on e.profesional_id = p.id and e.fecha = p_fecha and e.disponible
    union all
    select p.id, h.hora_inicio, h.hora_fin
    from pros p
    join public.horarios_disponibles h
      on h.profesional_id = p.id and h.dia_semana = extract(dow from p_fecha)::smallint
    where not exists (
      select 1 from public.horarios_excepciones e
      where e.profesional_id = p.id and e.fecha = p_fecha
    )
  ),
  candidatos as (
    select distinct t.prof_id, gs as ini_local
    from tramos t
    cross join lateral generate_series(
      p_fecha + t.desde,
      p_fecha + t.hasta - make_interval(mins => v_srv.duracion_minutos),
      interval '15 minutes'
    ) as gs
  ),
  turnos as (
    select c.prof_id,
           c.ini_local at time zone v_neg.timezone as ini,
           (c.ini_local + make_interval(mins => v_srv.duracion_minutos)) at time zone v_neg.timezone as fin
    from candidatos c
  )
  select tu.prof_id, tu.ini, tu.fin
  from turnos tu
  where tu.ini >= now() + make_interval(mins => v_neg.anticipacion_minutos)
    and not exists (
      select 1 from public.reservas r
      where r.profesional_id = tu.prof_id
        and r.estado = 'confirmada'
        and r.rango && tstzrange(tu.ini, tu.fin, '[)')
    )
  order by tu.ini, tu.prof_id;
end;
$f$;

revoke execute on function public.horarios_libres(uuid, uuid, date, uuid) from public;
grant execute on function public.horarios_libres(uuid, uuid, date, uuid) to anon, authenticated;
