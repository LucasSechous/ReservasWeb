-- Prueba de crear_negocio() (Fase 7). Simula sesiones con set_config + set role y se auto-revierte:
-- termina con un error a propósito (RESULTADO). Usa cuentas existentes de auth.users solo por la clave foránea.
do $t$
declare
  uid_x  uuid;
  uid_y  uuid;
  neg_x  uuid;
  neg_n  uuid;
  datos  jsonb;
  v_n    int;
  v_dia  date;
  r      record;
  v_out  text[] := '{}';
begin
  select id into uid_x from auth.users order by created_at limit 1;
  select id into uid_y from auth.users order by created_at limit 1 offset 1;

  insert into public.negocios (slug, nombre) values ('test-existente', 'Existente') returning id into neg_x;
  insert into public.usuarios (negocio_id, auth_user_id, email, nombre, rol)
    values (null, uid_x, 'operador@ejemplo.com', 'Operador', 'admin_plataforma');
  insert into public.usuarios (negocio_id, auth_user_id, email, nombre, rol)
    values (neg_x, uid_y, 'dueno@ejemplo.com', 'Dueño', 'owner');

  datos := jsonb_build_object(
    'slug', 'barberia-el-faro', 'nombre', 'Barbería El Faro', 'email', 'faro@ejemplo.com',
    'telefono', '099111222', 'direccion', 'Rambla 123',
    'servicios', jsonb_build_array(
      jsonb_build_object('nombre', 'Corte', 'duracion_minutos', 30, 'precio', 500),
      jsonb_build_object('nombre', 'Corte + barba', 'duracion_minutos', 45, 'precio', 750)),
    'profesionales', jsonb_build_array(jsonb_build_object('nombre', 'Ana'), jsonb_build_object('nombre', 'Beto')),
    'horario', jsonb_build_array(
      jsonb_build_object('dia', 3, 'desde', '09:00', 'hasta', '13:00'),
      jsonb_build_object('dia', 3, 'desde', '14:00', 'hasta', '19:00'),
      jsonb_build_object('dia', 4, 'desde', '09:00', 'hasta', '13:00')),
    'dueno_email', 'Faro@Ejemplo.com', 'dueno_nombre', 'Dueño Faro');

  -- T1: un dueño no puede dar de alta negocios
  perform set_config('request.jwt.claims', json_build_object('sub', uid_y, 'email', 'dueno@ejemplo.com', 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', uid_y::text, true);
  execute 'set local role authenticated';
  begin
    perform public.crear_negocio(datos);
    v_out := array_append(v_out, 'T1 FALLO un dueño pudo crear un negocio');
  exception when others then
    v_out := array_append(v_out, case when sqlerrm = 'SOLO_OPERADOR'
      then 'T1 OK   un dueño no puede crear negocios' else 'T1 FALLO error inesperado: ' || sqlerrm end);
  end;
  execute 'reset role';

  -- T2: el público tampoco
  execute 'set local role anon';
  begin
    perform public.crear_negocio(datos);
    v_out := array_append(v_out, 'T2 FALLO el público pudo crear un negocio');
  exception when others then
    v_out := array_append(v_out, case when sqlstate = '42501'
      then 'T2 OK   el público no puede crear negocios' else 'T2 FALLO error inesperado: ' || sqlerrm end);
  end;
  execute 'reset role';

  -- Como operador:
  perform set_config('request.jwt.claims', json_build_object('sub', uid_x, 'email', 'operador@ejemplo.com', 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', uid_x::text, true);
  execute 'set local role authenticated';

  -- T3: el operador crea el negocio completo
  neg_n := public.crear_negocio(datos);
  v_out := array_append(v_out, case when neg_n is not null
    then 'T3 OK   el operador crea el negocio' else 'T3 FALLO no devolvió id' end);
  execute 'reset role';

  select count(*) into v_n from public.servicios where negocio_id = neg_n;
  v_out := array_append(v_out, case when v_n = 2 then 'T4 OK   2 servicios' else 'T4 FALLO servicios: ' || v_n end);
  select count(*) into v_n from public.profesionales where negocio_id = neg_n;
  v_out := array_append(v_out, case when v_n = 2 then 'T5 OK   2 profesionales' else 'T5 FALLO profesionales: ' || v_n end);
  select count(*) into v_n from public.profesional_servicios ps join public.profesionales p on p.id = ps.profesional_id where p.negocio_id = neg_n;
  v_out := array_append(v_out, case when v_n = 4 then 'T6 OK   cada profesional hace los 2 servicios' else 'T6 FALLO profesional_servicios: ' || v_n end);
  select count(*) into v_n from public.horarios_disponibles h join public.profesionales p on p.id = h.profesional_id where p.negocio_id = neg_n;
  v_out := array_append(v_out, case when v_n = 6 then 'T7 OK   3 tramos de horario por profesional' else 'T7 FALLO horarios: ' || v_n end);
  select * into r from public.usuarios where negocio_id = neg_n;
  v_out := array_append(v_out, case when r.rol = 'owner' and r.email = 'faro@ejemplo.com' and r.auth_user_id is null
    then 'T8 OK   dueño invitado (mail en minúsculas, sin cuenta todavía)' else 'T8 FALLO invitación: ' || coalesce(r::text, 'sin fila') end);

  -- T9: el negocio nuevo ya se puede reservar: el público ve horarios un miércoles
  v_dia := date_trunc('week', now() at time zone 'America/Montevideo')::date + 9;
  execute 'set local role anon';
  select count(*) into v_n from public.horarios_libres(
    neg_n, (select id from public.servicios where negocio_id = neg_n and nombre = 'Corte'), v_dia);
  execute 'reset role';
  -- Cada profesional: 15 turnos de mañana + 19 de tarde = 34; dos profesionales = 68
  v_out := array_append(v_out, case when v_n = 68
    then 'T9 OK   el negocio nuevo ya ofrece 68 turnos' else 'T9 FALLO ofrece ' || v_n || ' turnos' end);

  -- Otra vez como operador, los casos de error
  execute 'set local role authenticated';

  begin
    perform public.crear_negocio(datos || '{"slug":"panel"}');
    v_out := array_append(v_out, 'T10 FALLO aceptó un slug reservado');
  exception when others then
    v_out := array_append(v_out, case when sqlerrm = 'SLUG_RESERVADO'
      then 'T10 OK  rechaza slugs reservados' else 'T10 FALLO error inesperado: ' || sqlerrm end);
  end;

  begin
    perform public.crear_negocio(datos);
    v_out := array_append(v_out, 'T11 FALLO aceptó un slug repetido');
  exception when unique_violation then
    v_out := array_append(v_out, 'T11 OK  rechaza slugs repetidos');
  end;

  begin
    perform public.crear_negocio((datos - 'servicios') || '{"slug":"sin-servicios"}');
    v_out := array_append(v_out, 'T12 FALLO aceptó un negocio sin servicios');
  exception when others then
    v_out := array_append(v_out, case when sqlerrm = 'SIN_SERVICIOS'
      then 'T12 OK  exige al menos un servicio' else 'T12 FALLO error inesperado: ' || sqlerrm end);
  end;

  -- T13: si algo falla a mitad de camino no queda nada: el segundo servicio tiene duración inválida
  begin
    perform public.crear_negocio(
      jsonb_set(datos, '{servicios,1,duracion_minutos}', '0') || '{"slug":"a-medias"}');
    v_out := array_append(v_out, 'T13 FALLO aceptó una duración inválida');
  exception when others then
    null;
  end;
  execute 'reset role';
  select count(*) into v_n from public.negocios where slug = 'a-medias';
  v_out := array_append(v_out, case when v_n = 0
    then 'T13 OK  si algo falla no queda un negocio a medias' else 'T13 FALLO quedó un negocio a medias' end);

  raise exception 'RESULTADO (revertido a propósito): %', E'\n' || array_to_string(v_out, E'\n') using errcode = 'P0001';
end
$t$;
