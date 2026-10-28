-- Prueba del acceso al panel (Fase 6): completar_perfil() y las reglas RLS de cada rol.
-- Simula sesiones con set_config + set role. Usa las cuentas que ya existen en auth.users solo para
-- cumplir la clave foránea y se auto-revierte: termina con un error a propósito (RESULTADO).
do $t$
declare
  uid_x   uuid;
  uid_y   uuid;
  neg_a   uuid;
  neg_b   uuid;
  srv_a   uuid;
  srv_b   uuid;
  pro_a   uuid;
  pro_b   uuid;
  res_a   uuid;
  res_b   uuid;
  v_dia   date;
  v_ini   timestamptz;
  v_n     int;
  r       record;
  v_out   text[] := '{}';
begin
  select id into uid_x from auth.users order by created_at limit 1;
  select id into uid_y from auth.users order by created_at limit 1 offset 1;
  if uid_x is null or uid_y is null then
    raise exception 'Hacen falta 2 cuentas en auth.users para esta prueba';
  end if;

  insert into public.negocios (slug, nombre) values ('test-a', 'Negocio A') returning id into neg_a;
  insert into public.negocios (slug, nombre) values ('test-b', 'Negocio B') returning id into neg_b;
  insert into public.servicios (negocio_id, nombre, duracion_minutos, precio) values (neg_a, 'Corte', 30, 500) returning id into srv_a;
  insert into public.servicios (negocio_id, nombre, duracion_minutos, precio) values (neg_b, 'Corte', 30, 500) returning id into srv_b;
  insert into public.profesionales (negocio_id, nombre) values (neg_a, 'Pro A') returning id into pro_a;
  insert into public.profesionales (negocio_id, nombre) values (neg_b, 'Pro B') returning id into pro_b;

  v_dia := (now() at time zone 'America/Montevideo')::date + 5;
  v_ini := (v_dia + time '10:00') at time zone 'America/Montevideo';
  insert into public.reservas (negocio_id, profesional_id, servicio_id, cliente_nombre, cliente_telefono, rango, estado, origen, precio_final)
    values (neg_a, pro_a, srv_a, 'Cliente A1', '099000001', tstzrange(v_ini, v_ini + interval '30 minutes', '[)'), 'confirmada', 'manual', 500)
    returning id into res_a;
  insert into public.reservas (negocio_id, profesional_id, servicio_id, cliente_nombre, cliente_telefono, rango, estado, origen, precio_final)
    values (neg_a, pro_a, srv_a, 'Cliente A2', '099000002', tstzrange(v_ini + interval '1 hour', v_ini + interval '90 minutes', '[)'), 'confirmada', 'manual', 500);
  insert into public.reservas (negocio_id, profesional_id, servicio_id, cliente_nombre, cliente_telefono, rango, estado, origen, precio_final)
    values (neg_b, pro_b, srv_b, 'Cliente B1', '099000003', tstzrange(v_ini, v_ini + interval '30 minutes', '[)'), 'confirmada', 'manual', 500)
    returning id into res_b;

  -- T1: una cuenta que nadie invitó no obtiene ningún panel
  perform set_config('request.jwt.claims', json_build_object('sub', uid_y, 'email', 'otro@ejemplo.com', 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', uid_y::text, true);
  execute 'set local role authenticated';
  select count(*) into v_n from public.completar_perfil();
  execute 'reset role';
  v_out := array_append(v_out, case when v_n = 0
    then 'T1 OK   cuenta no invitada: sin acceso' else 'T1 FALLO una cuenta no invitada obtuvo acceso' end);

  -- T2: el mail del operador, sin operador todavía, queda como admin_plataforma sin negocio
  perform set_config('request.jwt.claims', json_build_object('sub', uid_x, 'email', 'SechousLucasUY@gmail.com', 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', uid_x::text, true);
  execute 'set local role authenticated';
  select * into r from public.completar_perfil();
  execute 'reset role';
  v_out := array_append(v_out, case when r.rol = 'admin_plataforma' and r.negocio_id is null
    then 'T2 OK   el operador entra como admin_plataforma' else 'T2 FALLO operador: ' || coalesce(r.rol, 'sin rol') end);

  -- T3: llamarla otra vez no duplica nada
  execute 'set local role authenticated';
  select count(*) into v_n from public.completar_perfil();
  execute 'reset role';
  select count(*) into v_n from public.usuarios where rol = 'admin_plataforma';
  v_out := array_append(v_out, case when v_n = 1
    then 'T3 OK   un solo operador' else 'T3 FALLO hay ' || v_n || ' operadores' end);

  -- T4: un dueño invitado por el operador queda vinculado a su negocio
  insert into public.usuarios (negocio_id, email, nombre, rol) values (neg_a, 'duenoa@ejemplo.com', 'Dueño A', 'owner');
  perform set_config('request.jwt.claims', json_build_object('sub', uid_y, 'email', 'DuenoA@Ejemplo.com', 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', uid_y::text, true);
  execute 'set local role authenticated';
  select * into r from public.completar_perfil();
  v_out := array_append(v_out, case when r.rol = 'owner' and r.negocio_id = neg_a
    then 'T4 OK   dueño invitado vinculado a su negocio' else 'T4 FALLO dueño: ' || coalesce(r.rol, 'sin rol') end);

  -- Como dueño del negocio A (sigue la sesión de uid_y):
  select count(*) into v_n from public.reservas;
  v_out := array_append(v_out, case when v_n = 2
    then 'T5 OK   el dueño ve solo las 2 reservas de su negocio' else 'T5 FALLO el dueño ve ' || v_n || ' reservas' end);

  select count(*) into v_n from public.reservas where negocio_id = neg_b;
  v_out := array_append(v_out, case when v_n = 0
    then 'T6 OK   no ve reservas de otro negocio' else 'T6 FALLO ve reservas de otro negocio' end);

  update public.reservas set estado = 'cancelada' where id = res_b;
  get diagnostics v_n = row_count;
  v_out := array_append(v_out, case when v_n = 0
    then 'T7 OK   no puede cancelar reservas de otro negocio' else 'T7 FALLO canceló una reserva ajena' end);

  update public.reservas set estado = 'cancelada' where id = res_a;
  get diagnostics v_n = row_count;
  v_out := array_append(v_out, case when v_n = 1
    then 'T8 OK   puede cancelar las reservas de su negocio' else 'T8 FALLO no pudo cancelar la propia' end);

  begin
    insert into public.reservas (negocio_id, profesional_id, cliente_nombre, rango, estado, origen)
      values (neg_a, pro_a, 'Bloqueo', tstzrange(v_ini + interval '3 hours', v_ini + interval '4 hours', '[)'), 'confirmada', 'bloqueo');
    v_out := array_append(v_out, 'T9 OK   puede bloquear un horario en su negocio');
  exception when others then
    v_out := array_append(v_out, 'T9 FALLO no pudo bloquear: ' || sqlerrm);
  end;

  begin
    insert into public.reservas (negocio_id, profesional_id, cliente_nombre, rango, estado, origen)
      values (neg_b, pro_b, 'Bloqueo', tstzrange(v_ini + interval '3 hours', v_ini + interval '4 hours', '[)'), 'confirmada', 'bloqueo');
    v_out := array_append(v_out, 'T10 FALLO bloqueó un horario en un negocio ajeno');
  exception when others then
    v_out := array_append(v_out, case when sqlstate = '42501'
      then 'T10 OK  no puede bloquear en un negocio ajeno' else 'T10 FALLO error inesperado: ' || sqlerrm end);
  end;

  begin
    insert into public.reservas (negocio_id, profesional_id, servicio_id, cliente_nombre, cliente_telefono, rango, estado, origen, precio_final)
      values (neg_a, pro_a, srv_a, 'Falso', '099111222', tstzrange(v_ini + interval '5 hours', v_ini + interval '6 hours', '[)'), 'confirmada', 'publico', 500);
    v_out := array_append(v_out, 'T11 FALLO el dueño creó una reserva "pública" saltándose reservar()');
  exception when others then
    v_out := array_append(v_out, case when sqlstate = '42501'
      then 'T11 OK  el dueño no puede falsificar reservas públicas' else 'T11 FALLO error inesperado: ' || sqlerrm end);
  end;

  select count(*) into v_n from public.usuarios;
  v_out := array_append(v_out, case when v_n = 1
    then 'T12 OK  el dueño ve solo su propio usuario' else 'T12 FALLO el dueño ve ' || v_n || ' usuarios' end);
  execute 'reset role';

  -- Como operador (uid_x): ve todo
  perform set_config('request.jwt.claims', json_build_object('sub', uid_x, 'email', 'sechouslucasuy@gmail.com', 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', uid_x::text, true);
  execute 'set local role authenticated';
  select count(*) into v_n from public.reservas where negocio_id in (neg_a, neg_b);
  v_out := array_append(v_out, case when v_n = 4
    then 'T13 OK  el operador ve las reservas de todos los negocios' else 'T13 FALLO el operador ve ' || v_n || ' de 4' end);
  execute 'reset role';

  -- Público sin sesión: no puede leer reservas
  execute 'set local role anon';
  begin
    select count(*) into v_n from public.reservas;
    v_out := array_append(v_out, 'T14 FALLO el público pudo leer reservas');
  exception when others then
    v_out := array_append(v_out, case when sqlstate = '42501'
      then 'T14 OK  el público no puede leer reservas' else 'T14 FALLO error inesperado: ' || sqlerrm end);
  end;
  execute 'reset role';

  raise exception 'RESULTADO (revertido a propósito): %', E'\n' || array_to_string(v_out, E'\n') using errcode = 'P0001';
end
$t$;
