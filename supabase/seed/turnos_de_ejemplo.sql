-- Turnos de ejemplo para las demos con reservas (barbería, estética y peluquería).
-- Llena los próximos 30 días con reservas al azar, para que se vea una agenda con vida y horarios ya tomados.
-- Se puede correr de nuevo cuando pasen los días: primero borra lo que cargó la vez anterior y vuelve a llenar.
-- Todo lo que carga lleva un mail @ejemplo.demo; es lo único que toca. No usa los mails ni los datos de nadie real.
--
-- Para dejar las demos sin turnos de ejemplo:
--   delete from public.reservas where cliente_email like '%@ejemplo.demo';

delete from public.reservas where cliente_email like '%@ejemplo.demo';

do $seed$
declare
  v_nombres   text[] := array['Martín','Santiago','Matías','Nicolás','Facundo','Agustín','Bruno','Diego','Federico','Joaquín',
                              'Camila','Lucía','Valentina','Sofía','Florencia','Agustina','Micaela','Julieta','Carolina','Natalia'];
  v_apellidos text[] := array['Rodríguez','González','Pérez','Fernández','García','Martínez','Silva','Techera','Cabrera','Núñez',
                              'Acosta','Pereira','Sosa','Rivero','Álvarez','Ferreira','Machado','Correa','Olivera','Benítez'];
  n record; p record; t record; s record;
  v_dia date; v_hoy date; v_cursor time; v_fin time; v_dur int;
  v_servicios uuid[]; v_ini timestamptz; v_fin_ts timestamptz;
  v_prob numeric; v_azar numeric; v_nom text; v_ape text; v_estado text; v_i int := 0;
begin
  for n in select id, slug, timezone, anticipacion_minutos, ventana_dias from public.negocios
           where slug in ('barberia-demo', 'estetica-demo', 'peluqueria-demo')
  loop
    v_hoy := (now() at time zone n.timezone)::date;

    for p in select id from public.profesionales where negocio_id = n.id and activo loop
      -- Servicios que hace ese profesional (si no tiene asignados, todos los del negocio).
      select coalesce(array_agg(sv.id), '{}') into v_servicios
      from public.profesional_servicios ps join public.servicios sv on sv.id = ps.servicio_id
      where ps.profesional_id = p.id and sv.activo;
      if cardinality(v_servicios) = 0 then
        select array_agg(id) into v_servicios from public.servicios where negocio_id = n.id and activo;
      end if;

      for v_dia in select generate_series(v_hoy, v_hoy + n.ventana_dias, interval '1 day')::date loop
        -- Más ocupado en los próximos días y menos hacia el final, como pasa en la realidad.
        v_prob := case when v_dia - v_hoy <= 7 then 0.62 when v_dia - v_hoy <= 18 then 0.45 else 0.28 end;

        for t in select hora_inicio, hora_fin from public.horarios_disponibles
                 where profesional_id = p.id and dia_semana = extract(dow from v_dia)::int
                 order by hora_inicio
        loop
          v_cursor := t.hora_inicio;
          loop
            exit when v_cursor >= t.hora_fin;
            if random() < v_prob then
              select * into s from public.servicios where id = v_servicios[1 + floor(random() * cardinality(v_servicios))::int];
              v_dur := s.duracion_minutos;
              v_fin := v_cursor + make_interval(mins => v_dur);
              exit when v_fin > t.hora_fin or v_fin < v_cursor;

              v_ini := (v_dia::timestamp + v_cursor) at time zone n.timezone;
              v_fin_ts := (v_dia::timestamp + v_fin) at time zone n.timezone;

              if v_ini > now() + make_interval(mins => n.anticipacion_minutos) then
                v_azar := random();
                v_estado := case when v_azar < 0.07 then 'cancelada' else 'confirmada' end;
                v_nom := v_nombres[1 + floor(random() * cardinality(v_nombres))::int];
                v_ape := v_apellidos[1 + floor(random() * cardinality(v_apellidos))::int];
                v_i := v_i + 1;
                begin
                  insert into public.reservas (
                    negocio_id, profesional_id, servicio_id, cliente_nombre, cliente_telefono, cliente_email,
                    estado, origen, precio_final, duracion_final_minutos, rango, cancelada_at, cancelada_por
                  ) values (
                    n.id, p.id, s.id, v_nom || ' ' || v_ape,
                    '09' || (1 + floor(random() * 9))::int::text || lpad(floor(random() * 1000000)::int::text, 6, '0'),
                    lower(translate(v_nom || '.' || v_ape, 'áéíóúñÁÉÍÓÚÑ', 'aeiounAEIOUN')) || v_i || '@ejemplo.demo',
                    v_estado,
                    case when random() < 0.2 then 'manual' else 'publico' end,
                    s.precio, v_dur,
                    tstzrange(v_ini, v_fin_ts, '[)'),
                    case when v_estado = 'cancelada' then now() end,
                    case when v_estado = 'cancelada' then 'cliente' end
                  );
                exception when exclusion_violation then
                  null; -- ya había una reserva real en ese horario: se deja como estaba
                end;
              end if;
              -- Después de un turno, a veces queda un hueco antes del siguiente.
              v_cursor := v_fin + make_interval(mins => (array[0, 0, 15, 30])[1 + floor(random() * 4)::int]);
            else
              v_cursor := v_cursor + interval '30 minutes';
            end if;
          end loop;
        end loop;
      end loop;
    end loop;
  end loop;
end
$seed$;
