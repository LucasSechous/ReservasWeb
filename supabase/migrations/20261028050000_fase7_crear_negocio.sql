-- Fase 7: alta de un negocio completo en un solo paso. Solo suma una función.
--
-- crear_negocio(datos) crea el negocio, sus servicios, sus profesionales (cada uno hace todos los
-- servicios y tiene el horario semanal indicado) y, si se pasa un mail, deja invitado al dueño.
-- Corre como una sola transacción: si algo falla, no queda nada a medias.
-- Es security invoker: la crea quien llama, así que además de la comprobación explícita rigen las
-- políticas RLS del operador. Un dueño o el público no pueden usarla.
--
-- Formato de `datos` (jsonb):
--   { "slug": "barberia-el-faro", "nombre": "...", "email": "...", "telefono": "...", "direccion": "...",
--     "timezone": "America/Montevideo", "anticipacion_minutos": 60, "ventana_dias": 30,
--     "servicios":     [ { "nombre": "...", "descripcion": "...", "duracion_minutos": 30, "precio": 500 } ],
--     "profesionales": [ { "nombre": "..." } ],
--     "horario":       [ { "dia": 1, "desde": "09:00", "hasta": "13:00" } ],   -- dia: 0 = domingo
--     "dueno_email": "...", "dueno_nombre": "..." }
create function public.crear_negocio(p_datos jsonb)
returns uuid
language plpgsql
set search_path = ''
as $f$
declare
  v_neg  uuid;
  v_prof uuid;
  v_slug text := lower(btrim(coalesce(p_datos ->> 'slug', '')));
  v_item jsonb;
  h      jsonb;
begin
  if not (select private.es_operador()) then
    raise exception 'SOLO_OPERADOR' using errcode = '42501';
  end if;

  -- Rutas que ya usa la aplicación: un negocio con ese slug taparía la página.
  if v_slug = any (array[
    'estado', 'panel', 'operador', 'login', 'auth', 'cancelar', 'privacidad', 'api', 'admin'
  ]) then
    raise exception 'SLUG_RESERVADO' using errcode = 'P0001';
  end if;

  if btrim(coalesce(p_datos ->> 'nombre', '')) = '' then
    raise exception 'NOMBRE_INVALIDO' using errcode = 'P0001';
  end if;
  if jsonb_array_length(coalesce(p_datos -> 'servicios', '[]')) = 0 then
    raise exception 'SIN_SERVICIOS' using errcode = 'P0001';
  end if;
  if jsonb_array_length(coalesce(p_datos -> 'profesionales', '[]')) = 0 then
    raise exception 'SIN_PROFESIONALES' using errcode = 'P0001';
  end if;
  if jsonb_array_length(coalesce(p_datos -> 'horario', '[]')) = 0 then
    raise exception 'SIN_HORARIO' using errcode = 'P0001';
  end if;

  insert into public.negocios (
    slug, nombre, email, telefono, direccion, timezone, anticipacion_minutos, ventana_dias
  ) values (
    v_slug,
    btrim(p_datos ->> 'nombre'),
    nullif(btrim(coalesce(p_datos ->> 'email', '')), ''),
    nullif(btrim(coalesce(p_datos ->> 'telefono', '')), ''),
    nullif(btrim(coalesce(p_datos ->> 'direccion', '')), ''),
    coalesce(nullif(p_datos ->> 'timezone', ''), 'America/Montevideo'),
    coalesce((p_datos ->> 'anticipacion_minutos')::int, 60),
    coalesce((p_datos ->> 'ventana_dias')::int, 30)
  )
  returning id into v_neg;

  for v_item in select * from jsonb_array_elements(p_datos -> 'servicios') loop
    insert into public.servicios (negocio_id, nombre, descripcion, duracion_minutos, precio)
    values (
      v_neg,
      btrim(v_item ->> 'nombre'),
      nullif(btrim(coalesce(v_item ->> 'descripcion', '')), ''),
      (v_item ->> 'duracion_minutos')::int,
      (v_item ->> 'precio')::numeric
    );
  end loop;

  for v_item in select * from jsonb_array_elements(p_datos -> 'profesionales') loop
    insert into public.profesionales (negocio_id, nombre)
    values (v_neg, btrim(v_item ->> 'nombre'))
    returning id into v_prof;

    insert into public.profesional_servicios (profesional_id, servicio_id)
    select v_prof, s.id from public.servicios s where s.negocio_id = v_neg;

    for h in select * from jsonb_array_elements(p_datos -> 'horario') loop
      insert into public.horarios_disponibles (profesional_id, dia_semana, hora_inicio, hora_fin)
      values (v_prof, (h ->> 'dia')::smallint, (h ->> 'desde')::time, (h ->> 'hasta')::time);
    end loop;
  end loop;

  if nullif(btrim(coalesce(p_datos ->> 'dueno_email', '')), '') is not null then
    insert into public.usuarios (negocio_id, email, nombre, rol)
    values (
      v_neg,
      lower(btrim(p_datos ->> 'dueno_email')),
      nullif(btrim(coalesce(p_datos ->> 'dueno_nombre', '')), ''),
      'owner'
    );
  end if;

  return v_neg;
end;
$f$;

revoke execute on function public.crear_negocio(jsonb) from public, anon;
grant execute on function public.crear_negocio(jsonb) to authenticated;
