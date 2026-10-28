-- Prueba de la Fase 2. Se puede correr las veces que haga falta: crea sus propios datos y
-- termina con un error a propósito (RESULTADO), así que la transacción se revierte y no deja nada.
-- Criterio de "terminada": dos reservas superpuestas del mismo profesional hacen fallar a la segunda.
do $t$
declare
  v_neg   uuid;
  v_srv   uuid;
  v_p1    uuid;
  v_p2    uuid;
  v_dia   date;
  v_ini   timestamptz;
  v_token uuid;
  r       record;
  v_ok    boolean;
  v_out   text[] := '{}';
begin
  insert into public.negocios (slug, nombre) values ('test-fase2', 'Test') returning id into v_neg;
  insert into public.servicios (negocio_id, nombre, duracion_minutos, precio)
    values (v_neg, 'Corte', 30, 500) returning id into v_srv;
  insert into public.profesionales (negocio_id, nombre) values (v_neg, 'P1') returning id into v_p1;
  insert into public.profesional_servicios values (v_p1, v_srv);
  insert into public.horarios_disponibles (profesional_id, dia_semana, hora_inicio, hora_fin)
    values (v_p1, 3, '09:00', '13:00'), (v_p1, 3, '14:00', '19:00'); -- miércoles, horario partido

  -- Miércoles de la semana que viene (dentro de la ventana de 30 días).
  v_dia := date_trunc('week', now() at time zone 'America/Montevideo')::date + 9;
  v_ini := (v_dia + time '10:00') at time zone 'America/Montevideo';

  -- T1: una reserva normal funciona
  select * into r from public.reservar(v_neg, v_srv, null, v_ini, 'Ana Test', '099123456');
  v_token := r.token_cancelacion;
  v_out := array_append(v_out, 'T1 OK   reserva normal a las 10:00');

  -- T2: el mismo horario falla
  begin
    perform public.reservar(v_neg, v_srv, null, v_ini, 'Beto Test', '099123457');
    v_out := array_append(v_out, 'T2 FALLO dejó reservar el mismo horario');
  exception when others then
    v_out := array_append(v_out, case when sqlerrm = 'HORARIO_NO_DISPONIBLE'
      then 'T2 OK   mismo horario rechazado' else 'T2 FALLO error inesperado: ' || sqlerrm end);
  end;

  -- T3: un turno que se superpone a la mitad falla
  begin
    perform public.reservar(v_neg, v_srv, null, v_ini + interval '15 minutes', 'Beto Test', '099123457');
    v_out := array_append(v_out, 'T3 FALLO dejó reservar un turno superpuesto');
  exception when others then
    v_out := array_append(v_out, case when sqlerrm = 'HORARIO_NO_DISPONIBLE'
      then 'T3 OK   turno superpuesto rechazado' else 'T3 FALLO error inesperado: ' || sqlerrm end);
  end;

  -- T4: el turno pegado (10:30) funciona
  begin
    perform public.reservar(v_neg, v_srv, null, v_ini + interval '30 minutes', 'Carla Test', '099123458');
    v_out := array_append(v_out, 'T4 OK   turno pegado a las 10:30 permitido');
  exception when others then
    v_out := array_append(v_out, 'T4 FALLO turno pegado rechazado: ' || sqlerrm);
  end;

  -- T5: el hueco del horario partido (13:30) falla
  begin
    perform public.reservar(v_neg, v_srv, null,
      (v_dia + time '13:30') at time zone 'America/Montevideo', 'Dani Test', '099123459');
    v_out := array_append(v_out, 'T5 FALLO dejó reservar en el hueco del horario partido');
  exception when others then
    v_out := array_append(v_out, case when sqlerrm = 'HORARIO_NO_DISPONIBLE'
      then 'T5 OK   hueco del horario partido rechazado' else 'T5 FALLO error inesperado: ' || sqlerrm end);
  end;

  -- T6: la base misma impide la superposición, aunque se intente insertar directo
  begin
    insert into public.reservas (negocio_id, profesional_id, servicio_id, cliente_nombre,
                                 cliente_telefono, rango, estado, origen, precio_final)
    values (v_neg, v_p1, v_srv, 'X', '099999999',
            tstzrange(v_ini + interval '10 minutes', v_ini + interval '40 minutes', '[)'),
            'confirmada', 'publico', 500);
    v_out := array_append(v_out, 'T6 FALLO la restricción no frenó el insert directo');
  exception when exclusion_violation then
    v_out := array_append(v_out, 'T6 OK   restricción anti-superposición frena el insert directo');
  end;

  -- T7: cancelar libera el horario
  v_ok := public.cancelar_reserva(v_token);
  begin
    perform public.reservar(v_neg, v_srv, null, v_ini, 'Eli Test', '099123460');
    v_out := array_append(v_out, case when v_ok
      then 'T7 OK   cancelar libera el horario' else 'T7 FALLO cancelar devolvió false' end);
  exception when others then
    v_out := array_append(v_out, 'T7 FALLO no se pudo reservar tras cancelar: ' || sqlerrm);
  end;

  -- T8: con dos profesionales, si el primero está ocupado asigna el segundo
  insert into public.profesionales (negocio_id, nombre) values (v_neg, 'P2') returning id into v_p2;
  insert into public.profesional_servicios values (v_p2, v_srv);
  insert into public.horarios_disponibles (profesional_id, dia_semana, hora_inicio, hora_fin)
    values (v_p2, 3, '09:00', '13:00');
  select * into r from public.reservar(v_neg, v_srv, null, v_ini, 'Fede Test', '099123461');
  v_out := array_append(v_out, case when r.profesional_id = v_p2
    then 'T8 OK   asignó al segundo profesional' else 'T8 FALLO no asignó al segundo profesional' end);

  -- T9: respeta la anticipación mínima
  begin
    perform public.reservar(v_neg, v_srv, null, now() + interval '10 minutes', 'Gus Test', '099123462');
    v_out := array_append(v_out, 'T9 FALLO dejó reservar sin anticipación');
  exception when others then
    v_out := array_append(v_out, case when sqlerrm in ('ANTICIPACION_INSUFICIENTE', 'FUERA_DE_HORARIO')
      then 'T9 OK   anticipación mínima respetada' else 'T9 FALLO error inesperado: ' || sqlerrm end);
  end;

  -- T10: respeta la ventana de días
  begin
    perform public.reservar(v_neg, v_srv, null,
      ((v_dia + 60) + time '10:00') at time zone 'America/Montevideo', 'Hana Test', '099123463');
    v_out := array_append(v_out, 'T10 FALLO dejó reservar fuera de la ventana');
  exception when others then
    v_out := array_append(v_out, case when sqlerrm = 'FUERA_DE_VENTANA'
      then 'T10 OK  ventana de días respetada' else 'T10 FALLO error inesperado: ' || sqlerrm end);
  end;

  raise exception 'RESULTADO (revertido a propósito): %', E'\n' || array_to_string(v_out, E'\n') using errcode = 'P0001';
end
$t$;
