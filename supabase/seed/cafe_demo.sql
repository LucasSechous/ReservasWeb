-- Datos de prueba: «Café Demo», demo de una landing simple (sin reservas): la carta vive en `servicios`.
-- No tiene profesionales ni horarios, así que no se puede reservar. Se corre una sola vez.
-- El teléfono es el de Lucas, para que el botón de WhatsApp de la demo le llegue a él.
with negocio as (
  insert into public.negocios (slug, nombre, email, telefono, direccion)
  values ('cafe-demo', 'Café Demo', null, '+59899088224', 'Maldonado, Uruguay')
  returning id
)
insert into public.servicios (negocio_id, nombre, descripcion, duracion_minutos, precio)
select n.id, s.nombre, s.descripcion, 5, s.precio
from negocio n,
(values
  ('Espresso', 'Café de especialidad, tostado en el día.', 120),
  ('Cappuccino', 'Espresso doble con leche texturizada.', 180),
  ('Flat white', 'Intenso y cremoso, con poca espuma.', 190),
  ('Latte helado', 'Espresso, leche y hielo. Con o sin vainilla.', 200),
  ('Tostadas con palta', 'Pan de masa madre, palta, limón y semillas.', 320),
  ('Medialunas', 'Dos medialunas de manteca, recién horneadas.', 140),
  ('Brownie', 'Chocolate negro y nueces, tibio.', 160),
  ('Jugo de naranja', 'Exprimido al momento.', 150)
) as s(nombre, descripcion, precio);
