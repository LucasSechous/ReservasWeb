-- Prueba del panel (Fase 9): lo que se agregó con agendar a mano, bloqueos y "vino / no vino".
-- Crea sus propios datos y termina con un error a propósito (RESULTADO), así que la transacción
-- se revierte y no deja nada. Se puede correr las veces que haga falta.
-- Criterio de "terminada": todas las líneas dicen OK.
do $t$
declare
  v_neg   uuid;
  v_srv   uuid;
  v_p1    uuid;
  v_dia   date;
  v_id    uuid;
  v_n     int;
  v_estado text;
  v_out   text[] := '{}';
  tz      constant text := 'America/Montevideo';
begin
  insert into public.negocios (slug, nombre) values ('test-panel-v2', 'Test') returning id into v_neg;
  insert into public.servicios (negocio_id, nombre, duracion_minutos, precio)
    values (v_neg, 'Corte', 30, 500) returning id into v_srv;
  insert into public.profesionales (negocio_id, nombre) values (v_neg, 'P1') returning id into v_p1;
  insert into public.profesional_servicios values (v_p1, v_srv);
  insert into public.horarios_disponibles (profesional_id, dia_semana, hora_inicio, hora_fin)
    values (v_p1, 3, '09:00', '13:00'); -- miércoles de 9 a 13: 15 turnos de 30 min

  v_dia := date_trunc('week', now() at time zone tz)::date + 9; -- miércoles de la semana que viene

  -- T1: el público no puede insertar en reservas directo (solo por reservar()).
  begin
    set local role anon;
    insert into public.reservas (negocio_id, profesional_id, servicio_id, cliente_nombre, cliente_telefono,
                                 estado, origen, precio_final, duracion_final_minutos, rango)
      values (v_neg, v_p1, v_srv, 'Intruso', '099000000', 'confirmada', 'publico', 500, 30,
              tstzrange((v_dia + time '09:00') at time zone tz, (v_dia + time '09:30') at time zone tz, '[)'));
    reset role;
    v_out := array_append(v_out, 'T1 FALLO el público pudo insertar una reserva directo');
  exception when insufficient_privilege then
    v_out := array_append(v_out, 'T1 OK   el público no puede insertar en reservas');
  end;

  -- T2: el público no puede leer reservas.
  begin
    set local role anon;
    select count(*) into v_n from public.reservas where negocio_id = v_neg;
    reset role;
    v_out := array_append(v_out, case when v_n = 0
      then 'T2 OK   el público no ve reservas' else 'T2 FALLO el público ve ' || v_n || ' reservas' end);
  exception when insufficient_privilege then
    v_out := array_append(v_out, 'T2 OK   el público no puede leer reservas');
  end;

  -- T3: una reserva a mano no puede pisar a una pública (la base rechaza la doble reserva).
  perform public.reservar(v_neg, v_srv, v_p1, (v_dia + time '10:00') at time zone tz,
                          'Ana Test', '099123456', null, null, md5(random()::text) || md5(random()::text));
  begin
    insert into public.reservas (negocio_id, profesional_id, servicio_id, cliente_nombre, cliente_telefono,
                                 estado, origen, precio_final, duracion_final_minutos, rango)
      values (v_neg, v_p1, v_srv, 'Beto Manual', '', 'confirmada', 'manual', 500, 30,
              tstzrange((v_dia + time '10:00') at time zone tz, (v_dia + time '10:30') at time zone tz, '[)'));
    v_out := array_append(v_out, 'T3 FALLO se pudo agendar a mano sobre una reserva pública');
  exception when exclusion_violation then
    v_out := array_append(v_out, 'T3 OK   agendar a mano sobre una pública es rechazado');
  end;

  -- T4: al cancelar la pública, el horario queda libre y se puede agendar a mano.
  update public.reservas set estado = 'cancelada', cancelada_por = 'negocio'
    where negocio_id = v_neg and estado = 'confirmada';
  begin
    insert into public.reservas (negocio_id, profesional_id, servicio_id, cliente_nombre, cliente_telefono,
                                 estado, origen, precio_final, duracion_final_minutos, rango)
      values (v_neg, v_p1, v_srv, 'Beto Manual', '', 'confirmada', 'manual', 500, 30,
              tstzrange((v_dia + time '10:00') at time zone tz, (v_dia + time '10:30') at time zone tz, '[)'))
      returning id into v_id;
    v_out := array_append(v_out, 'T4 OK   cancelar libera el horario y se agenda a mano (sin teléfono)');
  exception when exclusion_violation then
    v_out := array_append(v_out, 'T4 FALLO el horario cancelado sigue ocupado');
  end;

  -- T5: el ciclo de asistencia: confirmada → completada → no_show → confirmada, sin errores.
  begin
    update public.reservas set estado = 'completada' where id = v_id;
    update public.reservas set estado = 'no_show' where id = v_id;
    update public.reservas set estado = 'confirmada' where id = v_id;
    select estado into v_estado from public.reservas where id = v_id;
    v_out := array_append(v_out, case when v_estado = 'confirmada'
      then 'T5 OK   vino / no vino / deshacer' else 'T5 FALLO terminó en ' || v_estado end);
  exception when others then
    v_out := array_append(v_out, 'T5 FALLO ' || sqlerrm);
  end;

  -- T6: un bloqueo de 11:00 a 12:00 saca 5 turnos (10:45 a 11:45); al quitarlo vuelven. Día sin otras reservas.
  select count(*) into v_n from public.horarios_libres(v_neg, v_srv, v_dia + 7);
  v_out := array_append(v_out, case when v_n = 15
    then 'T6 OK   día sin reservas: 15 turnos' else 'T6 FALLO esperaba 15 y dio ' || v_n end);
  insert into public.reservas (negocio_id, profesional_id, cliente_nombre, rango, estado, origen)
    values (v_neg, v_p1, 'Bloqueo', tstzrange((v_dia + 7 + time '11:00') at time zone tz,
            (v_dia + 7 + time '12:00') at time zone tz, '[)'), 'confirmada', 'bloqueo')
    returning id into v_id;
  select count(*) into v_n from public.horarios_libres(v_neg, v_srv, v_dia + 7);
  v_out := array_append(v_out, case when v_n = 10
    then 'T6b OK  con el bloqueo: 10 turnos' else 'T6b FALLO esperaba 10 y dio ' || v_n end);
  update public.reservas set estado = 'cancelada' where id = v_id;
  select count(*) into v_n from public.horarios_libres(v_neg, v_srv, v_dia + 7);
  v_out := array_append(v_out, case when v_n = 15
    then 'T6c OK  al quitar el bloqueo vuelven los 15' else 'T6c FALLO esperaba 15 y dio ' || v_n end);

  -- T7: una reserva a mano de 9:00 a 9:30 saca el 9:00 y el 9:15 de la web pública. Quedan 13.
  insert into public.reservas (negocio_id, profesional_id, servicio_id, cliente_nombre, cliente_telefono,
                               estado, origen, precio_final, duracion_final_minutos, rango)
    values (v_neg, v_p1, v_srv, 'Caro Manual', '', 'confirmada', 'manual', 500, 30,
            tstzrange((v_dia + 14 + time '09:00') at time zone tz, (v_dia + 14 + time '09:30') at time zone tz, '[)'));
  select count(*) into v_n from public.horarios_libres(v_neg, v_srv, v_dia + 14);
  v_out := array_append(v_out, case when v_n = 13
    then 'T7 OK   la reserva a mano se refleja en la web pública: 13 turnos' else 'T7 FALLO esperaba 13 y dio ' || v_n end);

  raise exception 'RESULTADO (revertido a propósito): %', E'\n' || array_to_string(v_out, E'\n') using errcode = 'P0001';
end
$t$;
