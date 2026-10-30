-- Recordatorios del día anterior: se anota cuándo salió el recordatorio de cada turno para no mandarlo dos veces.
-- Solo suma una columna: no borra ni cambia nada de lo que ya existe.
alter table public.reservas
  add column if not exists recordatorio_enviado_at timestamptz;
