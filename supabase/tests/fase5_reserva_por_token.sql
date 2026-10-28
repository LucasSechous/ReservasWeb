-- Prueba de reserva_por_token() (Fase 5). Se auto-revierte: termina con un error a propósito.
do $t$
declare
  v_neg   uuid;
  v_srv   uuid;
  v_p1    uuid;
  v_dia   date;
  v_token uuid;
  r       record;
  v_n     int;
  v_out   text[] := '{}';
begin
  insert into public.negocios (slug, nombre, email) values ('test-fase5', 'Negocio Test', 'negocio@ejemplo.com')
    returning id into v_neg;
  insert into public.servicios (negocio_id, nombre, duracion_minutos, precio)
    values (v_neg, 'Corte', 30, 500) returning id into v_srv;
  insert into public.profesionales (negocio_id, nombre) values (v_neg, 'Martín') returning id into v_p1;
  insert into public.profesional_servicios values (v_p1, v_srv);
  insert into public.horarios_disponibles (profesional_id, dia_semana, hora_inicio, hora_fin)
    values (v_p1, 3, '09:00', '13:00');
  v_dia := date_trunc('week', now() at time zone 'America/Montevideo')::date + 9;

  select * into r from public.reservar(v_neg, v_srv, null,
    (v_dia + time '10:00') at time zone 'America/Montevideo', 'Ana Test', '099123456', 'ana@ejemplo.com');
  v_token := r.token_cancelacion;

  -- T1: devuelve los datos de la reserva
  select * into r from public.reserva_por_token(v_token);
  v_out := array_append(v_out, case
    when r.negocio_nombre = 'Negocio Test' and r.negocio_email = 'negocio@ejemplo.com'
     and r.servicio_nombre = 'Corte' and r.profesional_nombre = 'Martín'
     and r.cliente_nombre = 'Ana Test' and r.cliente_email = 'ana@ejemplo.com'
     and r.estado = 'confirmada' and r.puede_cancelar
    then 'T1 OK   devuelve los datos y permite cancelar'
    else 'T1 FALLO datos inesperados: ' || coalesce(r::text, 'sin fila') end);

  -- T2: un token desconocido no devuelve nada
  select count(*) into v_n from public.reserva_por_token(gen_random_uuid());
  v_out := array_append(v_out, case when v_n = 0
    then 'T2 OK   token desconocido: sin resultados' else 'T2 FALLO devolvió ' || v_n || ' filas' end);

  -- T3: tras cancelar, figura cancelada y ya no se puede cancelar de nuevo
  perform public.cancelar_reserva(v_token);
  select * into r from public.reserva_por_token(v_token);
  v_out := array_append(v_out, case when r.estado = 'cancelada' and not r.puede_cancelar
    then 'T3 OK   cancelada: estado y puede_cancelar correctos' else 'T3 FALLO estado ' || coalesce(r.estado, '?') end);

  -- T4: no expone el teléfono (la función no tiene esa columna)
  select count(*) into v_n from information_schema.parameters
   where specific_schema = 'public' and specific_name like 'reserva_por_token%'
     and parameter_mode = 'OUT' and parameter_name like '%telefono%';
  v_out := array_append(v_out, case when v_n = 0
    then 'T4 OK   no expone el teléfono' else 'T4 FALLO expone el teléfono' end);

  raise exception 'RESULTADO (revertido a propósito): %', E'\n' || array_to_string(v_out, E'\n') using errcode = 'P0001';
end
$t$;
