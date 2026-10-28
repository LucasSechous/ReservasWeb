-- Datos de prueba: «Estética Demo» y «Peluquería Demo», para mostrar a leads de esos rubros.
-- Se corre una sola vez, después de la migración de la Fase 2. No es una migración.
-- Lunes a viernes de 9 a 13 y de 14 a 19; sábado de 9 a 14. Todos los profesionales hacen todos los servicios.
with negocios_nuevos as (
  insert into public.negocios (slug, nombre, email, telefono, direccion)
  values
    ('estetica-demo', 'Estética Demo', null, null, 'Maldonado, Uruguay'),
    ('peluqueria-demo', 'Peluquería Demo', null, null, 'Maldonado, Uruguay')
  returning id, slug
),
servicios as (
  insert into public.servicios (negocio_id, nombre, descripcion, duracion_minutos, precio)
  select n.id, s.nombre, s.descripcion, s.duracion, s.precio
  from negocios_nuevos n
  join (values
    ('estetica-demo', 'Limpieza facial', 'Limpieza profunda, exfoliación y máscara hidratante.', 60, 1800),
    ('estetica-demo', 'Masaje relajante', 'Masaje de espalda y cuello con aceites.', 60, 1600),
    ('estetica-demo', 'Depilación definitiva', 'Sesión de piernas completas con láser.', 45, 2200),
    ('estetica-demo', 'Perfilado de cejas', 'Diseño y perfilado a la medida de tu rostro.', 20, 450),
    ('estetica-demo', 'Manicuría', 'Limado, cutículas y esmaltado semipermanente.', 45, 700),
    ('peluqueria-demo', 'Corte', 'Corte y peinado.', 45, 900),
    ('peluqueria-demo', 'Color de raíz', 'Retoque de raíz con tinte de calidad.', 90, 1800),
    ('peluqueria-demo', 'Brushing', 'Lavado, secado y brushing.', 40, 700),
    ('peluqueria-demo', 'Mechas', 'Mechas o balayage, con tratamiento incluido.', 150, 3500),
    ('peluqueria-demo', 'Peinado de evento', 'Peinado para fiestas y celebraciones.', 60, 1500)
  ) as s(slug, nombre, descripcion, duracion, precio) on s.slug = n.slug
  returning id, negocio_id
),
profesionales as (
  insert into public.profesionales (negocio_id, nombre)
  select n.id, p.nombre
  from negocios_nuevos n
  join (values
    ('estetica-demo', 'Camila'), ('estetica-demo', 'Lucía'),
    ('peluqueria-demo', 'Romina'), ('peluqueria-demo', 'Gabriel')
  ) as p(slug, nombre) on p.slug = n.slug
  returning id, negocio_id
),
atiende as (
  insert into public.profesional_servicios (profesional_id, servicio_id)
  select p.id, s.id
  from profesionales p
  join servicios s on s.negocio_id = p.negocio_id
  returning 1
)
insert into public.horarios_disponibles (profesional_id, dia_semana, hora_inicio, hora_fin)
select p.id, h.dia, h.inicio, h.fin
from profesionales p,
(values
  (1, time '09:00', time '13:00'), (1, time '14:00', time '19:00'),
  (2, time '09:00', time '13:00'), (2, time '14:00', time '19:00'),
  (3, time '09:00', time '13:00'), (3, time '14:00', time '19:00'),
  (4, time '09:00', time '13:00'), (4, time '14:00', time '19:00'),
  (5, time '09:00', time '13:00'), (5, time '14:00', time '19:00'),
  (6, time '09:00', time '14:00')
) as h(dia, inicio, fin);
