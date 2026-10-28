-- Datos de prueba: «Barbería Demo» con 3 servicios, 2 profesionales y horario partido.
-- Se corre una sola vez, después de la migración de la Fase 2. No es una migración.
with negocio as (
  insert into public.negocios (slug, nombre, email, telefono, direccion)
  values ('barberia-demo', 'Barbería Demo', null, null, 'Maldonado, Uruguay')
  returning id
),
servicios as (
  insert into public.servicios (negocio_id, nombre, descripcion, duracion_minutos, precio)
  select n.id, s.nombre, s.descripcion, s.duracion, s.precio
  from negocio n,
  (values
    ('Corte', 'Corte de cabello clásico.', 30, 500),
    ('Corte + barba', 'Corte de cabello y arreglo de barba.', 45, 750),
    ('Barba', 'Arreglo y perfilado de barba.', 20, 350)
  ) as s(nombre, descripcion, duracion, precio)
  returning id
),
profesionales as (
  insert into public.profesionales (negocio_id, nombre)
  select n.id, p.nombre
  from negocio n, (values ('Martín'), ('Santiago')) as p(nombre)
  returning id
),
atiende as (
  insert into public.profesional_servicios (profesional_id, servicio_id)
  select p.id, s.id from profesionales p cross join servicios s
  returning 1
)
-- Lunes a viernes de 9 a 13 y de 14 a 19; sábado de 9 a 14.
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
