-- Prueba de la gestión de la reserva por link (gestion_obtener_reserva, gestion_cancelar_reserva,
-- gestion_reprogramar_reserva). Se auto-revierte: termina con un error a propósito (RESULTADO).
-- Los tokens de prueba son texto fijo; en la app son 32 bytes aleatorios y solo se guarda su sha256.
do $t$
declare
  v_neg    uuid;
  v_neg2   uuid;
  v_srv    uuid;
  v_srv2   uuid;
  v_p1     uuid;
  v_p2     uuid;
  v_dia    date;
  v_ini    timestamptz;
  v_id     uuid;
  v_id_b   uuid;
  v_id_o   uuid;
  v_ahora  timestamptz := now();
  v_h      text;
  v_hb     text;
  v_ho     text;
  r        record;
  v_n      int;
  v_cancel timestamptz;
  v_out    text[] := '{}';
begin
  insert into public.negocios (slug, nombre, email, telefono) values ('test-gestion', 'Negocio Test', 'neg@ejemplo.com', '099000000')
    returning id into v_neg;
  insert into public.negocios (slug, nombre) values ('test-gestion-otro', 'Otro Negocio') returning id into v_neg2;
  insert into public.servicios (negocio_id, nombre, duracion_minutos, precio) values (v_neg, 'Corte', 30, 500) returning id into v_srv;
  insert into public.servicios (negocio_id, nombre, duracion_minutos, precio) values (v_neg2, 'Corte', 30, 700) returning id into v_srv2;
  insert into public.profesionales (negocio_id, nombre) values (v_neg, 'Martín') returning id into v_p1;
  insert into public.profesionales (negocio_id, nombre) values (v_neg2, 'Laura') returning id into v_p2;
  insert into public.profesional_servicios values (v_p1, v_srv), (v_p2, v_srv2);
  insert into public.horarios_disponibles (profesional_id, dia_semana, hora_inicio, hora_fin)
    values (v_p1, 3, '09:00', '13:00'), (v_p2, 3, '09:00', '13:00');
  v_dia := date_trunc('week', now() at time zone 'America/Montevideo')::date + 9; -- un miércoles, la semana que viene
  v_ini := (v_dia + time '10:00') at time zone 'America/Montevideo';

  v_h  := encode(sha256(convert_to('token-A', 'utf8')), 'hex');
  v_hb := encode(sha256(convert_to('token-B', 'utf8')), 'hex');
  v_ho := encode(sha256(convert_to('token-otro-negocio', 'utf8')), 'hex');

  select reserva_id into v_id from public.reservar(v_neg, v_srv, null, v_ini, 'Ana Test', '099123456', 'ana@ejemplo.com', null, v_h);
  select reserva_id into v_id_b from public.reservar(v_neg, v_srv, null, v_ini + interval '2 hours', 'Beto Test', '099123457', null, null, v_hb);
  select reserva_id into v_id_o from public.reservar(v_neg2, v_srv2, null, v_ini, 'Otra Test', '099123458', null, null, v_ho);

  -- T1: obtener devuelve los datos y permite cancelar y reprogramar
  select * into r from public.gestion_obtener_reserva(v_h, 2);
  v_out := array_append(v_out, case
    when r.reserva_id = v_id and r.negocio_nombre = 'Negocio Test' and r.negocio_telefono = '099000000'
     and r.servicio_nombre = 'Corte' and r.profesional_nombre = 'Martín' and r.cliente_nombre = 'Ana Test'
     and r.estado = 'confirmada' and r.precio_final = 500 and r.timezone = 'America/Montevideo'
     and r.puede_cancelar and r.puede_reprogramar and r.motivo is null and r.reprogramaciones = 0
    then 'T1 OK   obtener devuelve los datos y permite cancelar y reprogramar'
    else 'T1 FALLO datos inesperados: ' || coalesce(r::text, 'sin fila') end);

  -- T2: token desconocido: sin filas y las acciones fallan con NO_EXISTE
  select count(*) into v_n from public.gestion_obtener_reserva(encode(sha256(convert_to('nadie', 'utf8')), 'hex'), 2);
  v_out := array_append(v_out, case when v_n = 0 then 'T2 OK   token desconocido: obtener no devuelve nada'
    else 'T2 FALLO devolvió ' || v_n || ' filas' end);
  begin
    perform public.gestion_cancelar_reserva(encode(sha256(convert_to('nadie', 'utf8')), 'hex'));
    v_out := array_append(v_out, 'T2b FALLO cancelar con token desconocido no falló');
  exception when others then
    v_out := array_append(v_out, case when sqlerrm = 'NO_EXISTE' then 'T2b OK  cancelar con token desconocido: NO_EXISTE'
      else 'T2b FALLO error inesperado: ' || sqlerrm end);
  end;
  begin
    perform public.gestion_reprogramar_reserva(encode(sha256(convert_to('nadie', 'utf8')), 'hex'), v_ini, 2);
    v_out := array_append(v_out, 'T2c FALLO reprogramar con token desconocido no falló');
  exception when others then
    v_out := array_append(v_out, case when sqlerrm = 'NO_EXISTE' then 'T2c OK  reprogramar con token desconocido: NO_EXISTE'
      else 'T2c FALLO error inesperado: ' || sqlerrm end);
  end;

  -- T3: un token solo ve su propia reserva (y no la de otro negocio)
  select * into r from public.gestion_obtener_reserva(v_ho, 2);
  v_out := array_append(v_out, case when r.reserva_id = v_id_o and r.negocio_id = v_neg2 and r.cliente_nombre = 'Otra Test'
    then 'T3 OK   cada token ve solo su reserva' else 'T3 FALLO cruce entre reservas: ' || coalesce(r::text, '') end);

  -- T4: reprogramar mueve la MISMA reserva (mismo servicio, mismo precio, mismo profesional) y libera el horario viejo
  select * into r from public.gestion_reprogramar_reserva(v_h, v_ini + interval '1 hour', 2);
  select count(*) into v_n from public.reservas where id = v_id and lower(rango) = v_ini + interval '1 hour'
    and servicio_id = v_srv and profesional_id = v_p1 and precio_final = 500 and estado = 'confirmada' and reprogramaciones = 1;
  v_out := array_append(v_out, case when v_n = 1 and r.reprogramaciones = 1 and r.inicio = v_ini + interval '1 hour'
    then 'T4 OK   reprogramar actualiza la misma reserva'
    else 'T4 FALLO la reserva no quedó como se esperaba' end);
  select count(*) into v_n from public.horarios_libres(v_neg, v_srv, v_dia, v_p1) where inicio = v_ini;
  v_out := array_append(v_out, case when v_n = 1 then 'T4b OK  el horario viejo volvió a estar libre'
    else 'T4b FALLO el horario viejo sigue ocupado' end);

  -- T5: reprogramar a un horario ocupado falla con HORARIO_NO_DISPONIBLE y no cambia nada
  begin
    perform public.gestion_reprogramar_reserva(v_h, v_ini + interval '2 hours', 2);
    v_out := array_append(v_out, 'T5 FALLO dejó reprogramar a un horario ocupado');
  exception when others then
    v_out := array_append(v_out, case when sqlerrm = 'HORARIO_NO_DISPONIBLE' then 'T5 OK   horario ocupado: HORARIO_NO_DISPONIBLE'
      else 'T5 FALLO error inesperado: ' || sqlerrm end);
  end;
  select count(*) into v_n from public.reservas where id = v_id and reprogramaciones = 1 and lower(rango) = v_ini + interval '1 hour';
  v_out := array_append(v_out, case when v_n = 1 then 'T5b OK  un intento fallido no cuenta como reprogramación'
    else 'T5b FALLO el intento fallido modificó la reserva' end);

  -- T6: mismo horario, y horario fuera de la atención
  begin
    perform public.gestion_reprogramar_reserva(v_h, v_ini + interval '1 hour', 2);
    v_out := array_append(v_out, 'T6 FALLO aceptó el mismo horario');
  exception when others then
    v_out := array_append(v_out, case when sqlerrm = 'MISMO_HORARIO' then 'T6 OK   mismo horario: MISMO_HORARIO'
      else 'T6 FALLO error inesperado: ' || sqlerrm end);
  end;
  begin
    perform public.gestion_reprogramar_reserva(v_h, (v_dia + time '03:00') at time zone 'America/Montevideo', 2);
    v_out := array_append(v_out, 'T6b FALLO aceptó un horario fuera de la atención');
  exception when others then
    v_out := array_append(v_out, case when sqlerrm = 'HORARIO_NO_DISPONIBLE' then 'T6b OK  fuera de horario: HORARIO_NO_DISPONIBLE'
      else 'T6b FALLO error inesperado: ' || sqlerrm end);
  end;

  -- T7: límite de reprogramaciones (máximo 2)
  perform public.gestion_reprogramar_reserva(v_h, v_ini + interval '90 minutes', 2); -- segunda
  begin
    perform public.gestion_reprogramar_reserva(v_h, v_ini + interval '30 minutes', 2); -- tercera
    v_out := array_append(v_out, 'T7 FALLO dejó reprogramar una tercera vez');
  exception when others then
    v_out := array_append(v_out, case when sqlerrm = 'LIMITE_REPROGRAMACIONES' then 'T7 OK   tercera reprogramación: LIMITE_REPROGRAMACIONES'
      else 'T7 FALLO error inesperado: ' || sqlerrm end);
  end;
  select * into r from public.gestion_obtener_reserva(v_h, 2);
  v_out := array_append(v_out, case when not r.puede_reprogramar and r.puede_cancelar and r.motivo = 'LIMITE_REPROGRAMACIONES'
    then 'T7b OK  en el límite todavía se puede cancelar' else 'T7b FALLO flags inesperados: ' || r::text end);

  -- T8: cancelar dentro de la ventana deja constancia y libera el horario
  select * into r from public.gestion_cancelar_reserva(v_h);
  select count(*) into v_n from public.reservas where id = v_id and estado = 'cancelada' and cancelada_por = 'cliente' and cancelada_at is not null;
  v_out := array_append(v_out, case when v_n = 1 and r.estado = 'cancelada' and not r.puede_cancelar and not r.puede_reprogramar
    then 'T8 OK   cancelar marca estado, cancelada_por = cliente y cancelada_at'
    else 'T8 FALLO la cancelación no quedó como se esperaba' end);
  select count(*) into v_n from public.horarios_libres(v_neg, v_srv, v_dia, v_p1) where inicio = v_ini + interval '90 minutes';
  v_out := array_append(v_out, case when v_n = 1 then 'T8b OK  el horario cancelado vuelve a estar disponible'
    else 'T8b FALLO el horario cancelado sigue ocupado' end);
  begin
    perform public.reservar(v_neg, v_srv, null, v_ini + interval '90 minutes', 'Nuevo Test', '099999999', null, null,
      encode(sha256(convert_to('token-nuevo', 'utf8')), 'hex'));
    v_out := array_append(v_out, 'T8c OK   otra persona puede reservar el horario cancelado');
  exception when others then
    v_out := array_append(v_out, 'T8c FALLO no se pudo reservar el horario cancelado: ' || sqlerrm);
  end;

  -- T9: doble cancelación: sin error, mismo estado y sin tocar cancelada_at
  v_cancel := (select cancelada_at from public.reservas where id = v_id);
  begin
    select * into r from public.gestion_cancelar_reserva(v_h);
    select count(*) into v_n from public.reservas where id = v_id and cancelada_at = v_cancel;
    v_out := array_append(v_out, case when r.estado = 'cancelada' and v_n = 1
      then 'T9 OK   cancelar dos veces devuelve el estado actual, sin error'
      else 'T9 FALLO la segunda cancelación cambió algo' end);
  exception when others then
    v_out := array_append(v_out, 'T9 FALLO la segunda cancelación dio error: ' || sqlerrm);
  end;

  -- T10: reprogramar una cancelada falla con YA_CANCELADA
  begin
    perform public.gestion_reprogramar_reserva(v_h, v_ini + interval '30 minutes', 2);
    v_out := array_append(v_out, 'T10 FALLO reprogramó una reserva cancelada');
  exception when others then
    v_out := array_append(v_out, case when sqlerrm = 'YA_CANCELADA' then 'T10 OK  reserva cancelada: YA_CANCELADA'
      else 'T10 FALLO error inesperado: ' || sqlerrm end);
  end;

  -- T11: fuera de la ventana de cambios (la reserva es dentro de 1 hora y el negocio exige 2)
  insert into public.reservas (negocio_id, profesional_id, servicio_id, cliente_nombre, cliente_telefono, rango, estado, origen,
                               precio_final, duracion_final_minutos, token_gestion_hash)
    values (v_neg, v_p1, v_srv, 'Cami Test', '099111111', tstzrange(v_ahora + interval '1 hour', v_ahora + interval '90 minutes', '[)'),
            'confirmada', 'publico', 500, 30, encode(sha256(convert_to('token-cerca', 'utf8')), 'hex'));
  select * into r from public.gestion_obtener_reserva(encode(sha256(convert_to('token-cerca', 'utf8')), 'hex'), 2);
  v_out := array_append(v_out, case when not r.puede_cancelar and not r.puede_reprogramar and r.motivo = 'FUERA_DE_VENTANA'
      and r.negocio_telefono = '099000000'
    then 'T11 OK  fuera de ventana: obtener lo marca y trae el contacto del negocio'
    else 'T11 FALLO flags inesperados: ' || coalesce(r::text, '') end);
  begin
    perform public.gestion_cancelar_reserva(encode(sha256(convert_to('token-cerca', 'utf8')), 'hex'));
    v_out := array_append(v_out, 'T11b FALLO canceló fuera de la ventana');
  exception when others then
    v_out := array_append(v_out, case when sqlerrm = 'FUERA_DE_VENTANA' then 'T11b OK  cancelar fuera de ventana: FUERA_DE_VENTANA'
      else 'T11b FALLO error inesperado: ' || sqlerrm end);
  end;
  begin
    perform public.gestion_reprogramar_reserva(encode(sha256(convert_to('token-cerca', 'utf8')), 'hex'), v_ini, 2);
    v_out := array_append(v_out, 'T11c FALLO reprogramó fuera de la ventana');
  exception when others then
    v_out := array_append(v_out, case when sqlerrm = 'FUERA_DE_VENTANA' then 'T11c OK  reprogramar fuera de ventana: FUERA_DE_VENTANA'
      else 'T11c FALLO error inesperado: ' || sqlerrm end);
  end;
  -- Con la ventana en 0 horas el mismo turno sí se puede cancelar.
  update public.negocios set horas_min_cambio = 0 where id = v_neg;
  select * into r from public.gestion_cancelar_reserva(encode(sha256(convert_to('token-cerca', 'utf8')), 'hex'));
  v_out := array_append(v_out, case when r.estado = 'cancelada' then 'T11d OK  la ventana sale de negocios.horas_min_cambio'
    else 'T11d FALLO no respetó horas_min_cambio = 0' end);

  -- T12: el turno ya ocurrió
  insert into public.reservas (negocio_id, profesional_id, servicio_id, cliente_nombre, cliente_telefono, rango, estado, origen,
                               precio_final, duracion_final_minutos, token_gestion_hash)
    values (v_neg, v_p1, v_srv, 'Pablo Test', '099111112', tstzrange(v_ahora - interval '3 hours', v_ahora - interval '2 hours 30 minutes', '[)'),
            'confirmada', 'publico', 500, 30, encode(sha256(convert_to('token-pasado', 'utf8')), 'hex'));
  select * into r from public.gestion_obtener_reserva(encode(sha256(convert_to('token-pasado', 'utf8')), 'hex'), 2);
  v_out := array_append(v_out, case when not r.puede_cancelar and r.motivo = 'YA_PASO'
    then 'T12 OK  turno pasado: motivo YA_PASO' else 'T12 FALLO flags inesperados: ' || coalesce(r::text, '') end);
  begin
    perform public.gestion_cancelar_reserva(encode(sha256(convert_to('token-pasado', 'utf8')), 'hex'));
    v_out := array_append(v_out, 'T12b FALLO canceló un turno que ya pasó');
  exception when others then
    v_out := array_append(v_out, case when sqlerrm = 'YA_PASO' then 'T12b OK  cancelar turno pasado: YA_PASO'
      else 'T12b FALLO error inesperado: ' || sqlerrm end);
  end;

  -- T13: una cancelación desde el panel (update común) deja cancelada_at y cancelada_por = negocio
  update public.reservas set estado = 'cancelada' where id = v_id_b;
  select count(*) into v_n from public.reservas where id = v_id_b and cancelada_por = 'negocio' and cancelada_at is not null;
  v_out := array_append(v_out, case when v_n = 1 then 'T13 OK  cancelar desde el panel marca cancelada_por = negocio'
    else 'T13 FALLO el trigger no completó la cancelación' end);

  -- T14: el hash es único, tiene forma de sha256 y reservar() rechaza un token sin hash válido
  begin
    perform public.reservar(v_neg2, v_srv2, null, v_ini + interval '1 hour', 'Dup Test', '099123459', null, null, v_ho);
    v_out := array_append(v_out, 'T14 FALLO aceptó un hash repetido');
  exception when unique_violation then
    v_out := array_append(v_out, 'T14 OK  el hash del token es único');
  end;
  begin
    perform public.reservar(v_neg2, v_srv2, null, v_ini + interval '1 hour', 'Mal Test', '099123459', null, null, 'token-en-claro');
    v_out := array_append(v_out, 'T14b FALLO aceptó un token que no es un hash');
  exception when others then
    v_out := array_append(v_out, case when sqlerrm = 'TOKEN_INVALIDO' then 'T14b OK  reservar() rechaza lo que no es un sha256: TOKEN_INVALIDO'
      else 'T14b FALLO error inesperado: ' || sqlerrm end);
  end;

  -- T15: permisos: solo service_role puede ejecutar las funciones gestion_*
  v_out := array_append(v_out, case
    when not has_function_privilege('anon', 'public.gestion_obtener_reserva(text,int)', 'execute')
     and not has_function_privilege('authenticated', 'public.gestion_obtener_reserva(text,int)', 'execute')
     and not has_function_privilege('anon', 'public.gestion_cancelar_reserva(text)', 'execute')
     and not has_function_privilege('authenticated', 'public.gestion_cancelar_reserva(text)', 'execute')
     and not has_function_privilege('anon', 'public.gestion_reprogramar_reserva(text,timestamptz,int,uuid)', 'execute')
     and not has_function_privilege('authenticated', 'public.gestion_reprogramar_reserva(text,timestamptz,int,uuid)', 'execute')
     and has_function_privilege('service_role', 'public.gestion_obtener_reserva(text,int)', 'execute')
     and has_function_privilege('service_role', 'public.gestion_cancelar_reserva(text)', 'execute')
     and has_function_privilege('service_role', 'public.gestion_reprogramar_reserva(text,timestamptz,int,uuid)', 'execute')
    then 'T15 OK  gestion_*: ejecutables solo por service_role'
    else 'T15 FALLO permisos inesperados sobre las funciones gestion_*' end);
  begin
    set local role anon;
    perform public.gestion_obtener_reserva(v_h, 2);
    reset role;
    v_out := array_append(v_out, 'T15b FALLO anon pudo llamar a gestion_obtener_reserva');
  exception when insufficient_privilege then
    reset role;
    v_out := array_append(v_out, 'T15b OK  anon no puede llamar a gestion_obtener_reserva');
  end;

  raise exception 'RESULTADO (revertido a propósito): %', E'\n' || array_to_string(v_out, E'\n') using errcode = 'P0001';
end
$t$;
