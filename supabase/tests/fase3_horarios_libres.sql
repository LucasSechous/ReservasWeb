-- Prueba de la Fase 3. Crea sus propios datos y termina con un error a propósito (RESULTADO),
-- así que la transacción se revierte y no deja nada. Se puede correr las veces que haga falta.
-- Criterio de "terminada": horarios_libres() devuelve exactamente los turnos esperados.
do $t$
declare
  v_neg    uuid;
  v_srv    uuid;
  v_srv45  uuid;
  v_p1     uuid;
  v_p2     uuid;
  v_dia    date;
  v_hoy    date;
  v_n      int;
  v_primero timestamptz;
  v_out    text[] := '{}';
begin
  insert into public.negocios (slug, nombre) values ('test-fase3', 'Test') returning id into v_neg;
  insert into public.servicios (negocio_id, nombre, duracion_minutos, precio)
    values (v_neg, 'Corte', 30, 500) returning id into v_srv;
  insert into public.servicios (negocio_id, nombre, duracion_minutos, precio)
    values (v_neg, 'Corte + barba', 45, 750) returning id into v_srv45;
  insert into public.profesionales (negocio_id, nombre) values (v_neg, 'P1') returning id into v_p1;
  insert into public.profesional_servicios values (v_p1, v_srv);
  insert into public.horarios_disponibles (profesional_id, dia_semana, hora_inicio, hora_fin)
    values (v_p1, 3, '09:00', '13:00'), (v_p1, 3, '14:00', '19:00'); -- miércoles, horario partido

  v_hoy := (now() at time zone 'America/Montevideo')::date;
  v_dia := date_trunc('week', now() at time zone 'America/Montevideo')::date + 9; -- miércoles de la semana que viene

  -- T1: horario partido. Tramo 1: 09:00 a 12:30 (15 turnos). Tramo 2: 14:00 a 18:30 (19 turnos). Total 34.
  select count(*) into v_n from public.horarios_libres(v_neg, v_srv, v_dia);
  v_out := array_append(v_out, case when v_n = 34
    then 'T1 OK   horario partido: 34 turnos' else 'T1 FALLO esperaba 34 y dio ' || v_n end);

  -- T2: una reserva 10:00-10:30 saca 09:45, 10:00 y 10:15 (el 10:30 queda libre). Quedan 31.
  perform public.reservar(v_neg, v_srv, null, (v_dia + time '10:00') at time zone 'America/Montevideo', 'Ana Test', '099123456', null, null, md5(random()::text) || md5(random()::text));
  select count(*) into v_n from public.horarios_libres(v_neg, v_srv, v_dia);
  v_out := array_append(v_out, case when v_n = 31
    then 'T2 OK   reserva existente: 31 turnos' else 'T2 FALLO esperaba 31 y dio ' || v_n end);
  select count(*) into v_n from public.horarios_libres(v_neg, v_srv, v_dia)
    where (inicio at time zone 'America/Montevideo')::time = time '10:30';
  v_out := array_append(v_out, case when v_n = 1
    then 'T2b OK  el turno pegado de las 10:30 sigue libre' else 'T2b FALLO el 10:30 no apareció' end);

  -- T3: un bloqueo 15:00-16:00 saca 14:45, 15:00, 15:15, 15:30 y 15:45. Quedan 26.
  insert into public.reservas (negocio_id, profesional_id, cliente_nombre, rango, estado, origen)
    values (v_neg, v_p1, 'Bloqueo', tstzrange((v_dia + time '15:00') at time zone 'America/Montevideo',
            (v_dia + time '16:00') at time zone 'America/Montevideo', '[)'), 'confirmada', 'bloqueo');
  select count(*) into v_n from public.horarios_libres(v_neg, v_srv, v_dia);
  v_out := array_append(v_out, case when v_n = 26
    then 'T3 OK   bloqueo de 15 a 16: 26 turnos' else 'T3 FALLO esperaba 26 y dio ' || v_n end);

  -- T4: una excepción de feriado deja ese día sin turnos (el miércoles siguiente, que no tiene reservas)
  insert into public.horarios_excepciones (profesional_id, fecha, disponible, motivo)
    values (v_p1, v_dia + 7, false, 'Feriado');
  select count(*) into v_n from public.horarios_libres(v_neg, v_srv, v_dia + 7);
  v_out := array_append(v_out, case when v_n = 0
    then 'T4 OK   feriado: 0 turnos' else 'T4 FALLO esperaba 0 y dio ' || v_n end);

  -- T5: una excepción con horario especial (10:00 a 12:00) reemplaza al horario semanal.
  -- Ventana 10:00 a 12:00: turnos de 10:00 a 11:30 = 7.
  insert into public.horarios_excepciones (profesional_id, fecha, disponible, hora_inicio, hora_fin, motivo)
    values (v_p1, v_dia + 14, true, '10:00', '12:00', 'Horario especial');
  select count(*) into v_n from public.horarios_libres(v_neg, v_srv, v_dia + 14);
  v_out := array_append(v_out, case when v_n = 7
    then 'T5 OK   horario especial: 7 turnos' else 'T5 FALLO esperaba 7 y dio ' || v_n end);

  -- T6: con un segundo profesional (09:00 a 13:00) se suman sus 15 turnos. Total 26 + 15 = 41.
  insert into public.profesionales (negocio_id, nombre) values (v_neg, 'P2') returning id into v_p2;
  insert into public.profesional_servicios values (v_p2, v_srv), (v_p2, v_srv45);
  insert into public.horarios_disponibles (profesional_id, dia_semana, hora_inicio, hora_fin)
    values (v_p2, 3, '09:00', '13:00');
  select count(*) into v_n from public.horarios_libres(v_neg, v_srv, v_dia);
  v_out := array_append(v_out, case when v_n = 41
    then 'T6 OK   dos profesionales: 41 turnos' else 'T6 FALLO esperaba 41 y dio ' || v_n end);
  select count(*) into v_n from public.horarios_libres(v_neg, v_srv, v_dia, v_p2);
  v_out := array_append(v_out, case when v_n = 15
    then 'T6b OK  filtrando por el segundo profesional: 15 turnos' else 'T6b FALLO esperaba 15 y dio ' || v_n end);

  -- T7: un servicio de 45 minutos no entra al final del tramo (último turno 12:15). 09:00 a 12:15 = 14.
  select count(*) into v_n from public.horarios_libres(v_neg, v_srv45, v_dia, v_p2);
  v_out := array_append(v_out, case when v_n = 14
    then 'T7 OK   servicio de 45 min: 14 turnos' else 'T7 FALLO esperaba 14 y dio ' || v_n end);

  -- T8: no devuelve días pasados ni fuera de la ventana de 30 días
  select count(*) into v_n from public.horarios_libres(v_neg, v_srv, v_hoy - 1);
  v_out := array_append(v_out, case when v_n = 0
    then 'T8 OK   día pasado: 0 turnos' else 'T8 FALLO día pasado dio ' || v_n end);
  select count(*) into v_n from public.horarios_libres(v_neg, v_srv, v_hoy + 31);
  v_out := array_append(v_out, case when v_n = 0
    then 'T8b OK  fuera de la ventana: 0 turnos' else 'T8b FALLO fuera de la ventana dio ' || v_n end);

  -- T9: hoy no ofrece turnos que no cumplan la anticipación mínima de 60 minutos
  select count(*) into v_n from public.horarios_libres(v_neg, v_srv, v_hoy) where inicio < now() + interval '60 minutes';
  v_out := array_append(v_out, case when v_n = 0
    then 'T9 OK   anticipación mínima respetada' else 'T9 FALLO hay ' || v_n || ' turnos con poca anticipación' end);

  -- T10: es coherente con reservar(): el primer turno que ofrece se puede reservar y deja de aparecer
  select min(inicio) into v_primero from public.horarios_libres(v_neg, v_srv, v_dia, v_p1);
  perform public.reservar(v_neg, v_srv, v_p1, v_primero, 'Beto Test', '099123457', null, null, md5(random()::text) || md5(random()::text));
  select count(*) into v_n from public.horarios_libres(v_neg, v_srv, v_dia, v_p1) where inicio = v_primero;
  v_out := array_append(v_out, case when v_n = 0
    then 'T10 OK  el turno ofrecido se reserva y desaparece' else 'T10 FALLO el turno reservado sigue apareciendo' end);

  raise exception 'RESULTADO (revertido a propósito): %', E'\n' || array_to_string(v_out, E'\n') using errcode = 'P0001';
end
$t$;
