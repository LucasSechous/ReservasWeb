-- Datos de prueba: «Clínica Demo» (rubro salud: especialistas y consultas).
-- Se corre una sola vez, después de la migración de la Fase 2. No es una migración.
-- A diferencia de las otras demos, cada especialista hace solo algunas consultas.
-- Lunes a viernes de 9 a 13 y de 14 a 18; sábado de 9 a 12.
with negocio_nuevo as (
  insert into public.negocios (slug, nombre, direccion)
  values ('clinica-demo', 'Clínica Demo', 'Maldonado, Uruguay')
  returning id
),
servicios as (
  insert into public.servicios (negocio_id, nombre, descripcion, duracion_minutos, precio)
  select n.id, s.nombre, s.descripcion, s.duracion, s.precio
  from negocio_nuevo n,
  (values
    ('Clínica médica', 'Consulta general, control y orientación.', 30, 1500),
    ('Cardiología', 'Consulta con electrocardiograma.', 40, 2400),
    ('Dermatología', 'Revisión de piel y lunares.', 30, 2000),
    ('Nutrición', 'Plan de alimentación y seguimiento.', 40, 1600)
  ) as s(nombre, descripcion, duracion, precio)
  returning id, nombre
),
profesionales as (
  insert into public.profesionales (negocio_id, nombre)
  select n.id, p.nombre
  from negocio_nuevo n,
  (values ('Dra. Ferreira'), ('Dr. Techera'), ('Lic. Sosa')) as p(nombre)
  returning id, nombre
),
atiende as (
  insert into public.profesional_servicios (profesional_id, servicio_id)
  select p.id, s.id
  from (values
    ('Dra. Ferreira', 'Clínica médica'), ('Dra. Ferreira', 'Cardiología'),
    ('Dr. Techera', 'Clínica médica'), ('Dr. Techera', 'Dermatología'),
    ('Lic. Sosa', 'Nutrición')
  ) as a(profesional, servicio)
  join profesionales p on p.nombre = a.profesional
  join servicios s on s.nombre = a.servicio
  returning 1
)
insert into public.horarios_disponibles (profesional_id, dia_semana, hora_inicio, hora_fin)
select p.id, h.dia, h.inicio, h.fin
from profesionales p,
(values
  (1, time '09:00', time '13:00'), (1, time '14:00', time '18:00'),
  (2, time '09:00', time '13:00'), (2, time '14:00', time '18:00'),
  (3, time '09:00', time '13:00'), (3, time '14:00', time '18:00'),
  (4, time '09:00', time '13:00'), (4, time '14:00', time '18:00'),
  (5, time '09:00', time '13:00'), (5, time '14:00', time '18:00'),
  (6, time '09:00', time '12:00')
) as h(dia, inicio, fin);
