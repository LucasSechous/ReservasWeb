-- Prueba del límite de reservas activas (Fase 4). Se auto-revierte: termina con un error a propósito.
do $t$
declare
  v_neg   uuid;
  v_srv   uuid;
  v_p1    uuid;
  v_dia   date;
  v_token uuid;
  r       record;
  v_out   text[] := '{}';
begin
  insert into public.negocios (slug, nombre) values ('test-fase4', 'Test') returning id into v_neg;
  insert into public.servicios (negocio_id, nombre, duracion_minutos, precio)
    values (v_neg, 'Corte rápido', 15, 400) returning id into v_srv;
  insert into public.profesionales (negocio_id, nombre) values (v_neg, 'P1') returning id into v_p1;
  insert into public.profesional_servicios values (v_p1, v_srv);
  insert into public.horarios_disponibles (profesional_id, dia_semana, hora_inicio, hora_fin)
    values (v_p1, 3, '09:00', '13:00');
  v_dia := date_trunc('week', now() at time zone 'America/Montevideo')::date + 9;

  -- T1: tres reservas con el mismo teléfono escrito de formas distintas están permitidas
  select * into r from public.reservar(v_neg, v_srv, null, (v_dia + time '09:00') at time zone 'America/Montevideo', 'Ana Test', '099123456');
  v_token := r.token_cancelacion;
  perform public.reservar(v_neg, v_srv, null, (v_dia + time '09:15') at time zone 'America/Montevideo', 'Ana Test', '099 123 456');
  perform public.reservar(v_neg, v_srv, null, (v_dia + time '09:30') at time zone 'America/Montevideo', 'Ana Test', '099-123-456');
  v_out := array_append(v_out, 'T1 OK   tres reservas del mismo teléfono permitidas');

  -- T2: la cuarta, con el mismo número escrito distinto, se rechaza
  begin
    perform public.reservar(v_neg, v_srv, null, (v_dia + time '09:45') at time zone 'America/Montevideo', 'Ana Test', '(099)123456');
    v_out := array_append(v_out, 'T2 FALLO dejó pasar la cuarta reserva');
  exception when others then
    v_out := array_append(v_out, case when sqlerrm = 'DEMASIADAS_RESERVAS'
      then 'T2 OK   la cuarta reserva del mismo teléfono se rechaza' else 'T2 FALLO error inesperado: ' || sqlerrm end);
  end;

  -- T3: otro teléfono sigue pudiendo reservar
  begin
    perform public.reservar(v_neg, v_srv, null, (v_dia + time '09:45') at time zone 'America/Montevideo', 'Beto Test', '098111222');
    v_out := array_append(v_out, 'T3 OK   otro teléfono puede reservar');
  exception when others then
    v_out := array_append(v_out, 'T3 FALLO otro teléfono rechazado: ' || sqlerrm);
  end;

  -- T4: cancelar una libera lugar y la cuarta pasa
  perform public.cancelar_reserva(v_token);
  begin
    perform public.reservar(v_neg, v_srv, null, (v_dia + time '10:00') at time zone 'America/Montevideo', 'Ana Test', '099123456');
    v_out := array_append(v_out, 'T4 OK   tras cancelar una, puede reservar otra');
  exception when others then
    v_out := array_append(v_out, 'T4 FALLO no pudo reservar tras cancelar: ' || sqlerrm);
  end;

  -- T5: el límite también aplica por mail, con teléfonos distintos y el mail en mayúsculas
  perform public.reservar(v_neg, v_srv, null, (v_dia + time '11:00') at time zone 'America/Montevideo', 'Carla Test', '091000001', 'carla@ejemplo.com');
  perform public.reservar(v_neg, v_srv, null, (v_dia + time '11:15') at time zone 'America/Montevideo', 'Carla Test', '091000002', 'carla@ejemplo.com');
  perform public.reservar(v_neg, v_srv, null, (v_dia + time '11:30') at time zone 'America/Montevideo', 'Carla Test', '091000003', 'carla@ejemplo.com');
  begin
    perform public.reservar(v_neg, v_srv, null, (v_dia + time '11:45') at time zone 'America/Montevideo', 'Carla Test', '091000004', 'CARLA@Ejemplo.com');
    v_out := array_append(v_out, 'T5 FALLO dejó pasar la cuarta reserva del mismo mail');
  exception when others then
    v_out := array_append(v_out, case when sqlerrm = 'DEMASIADAS_RESERVAS'
      then 'T5 OK   límite por mail (sin distinguir mayúsculas)' else 'T5 FALLO error inesperado: ' || sqlerrm end);
  end;

  raise exception 'RESULTADO (revertido a propósito): %', E'\n' || array_to_string(v_out, E'\n') using errcode = 'P0001';
end
$t$;
