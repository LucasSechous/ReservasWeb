# ReservasWeb

Plataforma de reservas online multi-negocio para barberías, peluquerías y centros de estética (Uruguay primero; después Argentina y Brasil). Lucas es el único operador: arma la landing de cada negocio a mano y les da de alta; los dueños no tienen panel de personalización.

## Stack (v1)

- Next.js (App Router) + TypeScript + Tailwind, en un solo proyecto desplegado en Vercel.
- Supabase: Postgres con Row Level Security + Auth (link mágico). Sin backend aparte (no NestJS).
- Resend para mails transaccionales.

## Reglas de arquitectura

- Multi-negocio en una sola base: toda tabla lleva `negocio_id` y RLS.
- Las reglas críticas viven en la base: `reservar()` valida y crea reservas; `horarios_libres()` calcula disponibilidad (Fase 2). El frontend nunca inserta en `reservas` directo.
- Doble reserva imposible por restricción `EXCLUDE USING gist (profesional_id WITH =, tsrange(fecha + hora_inicio, fecha + hora_fin) WITH &&) WHERE (estado = 'confirmada')` (`btree_gist` en el schema `extensions`).
- Varios profesionales por negocio, cada uno con su horario (`horarios_disponibles`, `dia_semana` 0 = domingo) y sus excepciones por fecha.
- Reservas en hora LOCAL del negocio (`fecha date` + `hora_inicio/hora_fin time`); `negocios.timezone` define la zona (`America/Montevideo` por defecto).
- El público no lee ni escribe `reservas`: solo llama a `reservar()` y `cancelar_reserva(token)` (RPC, SECURITY DEFINER). Los errores de `reservar()` son códigos en mayúsculas (`HORARIO_NO_DISPONIBLE`, `TELEFONO_INVALIDO`, etc.) que el frontend traduce.
- Cambios de esquema solo como migraciones en `supabase/migrations/`.
- `precio_final` se copia en cada reserva.
- Nunca commitear claves: `.env*` está ignorado. Variables públicas con `NEXT_PUBLIC_`; la `service_role` jamás en el cliente.

## Plan

El plan por fases (0 a 7) está en `docs/plan-v1.md`. Al terminar una tarea, tachala ahí (`[x]`). Trabajar una fase a la vez; cada fase termina con algo que se puede probar.

## Demos para leads

Las maquetas para prospectos se arman con el subagente `demo-builder` (o el comando `/demo <slug>`). Las fichas de entrada están en `demos/fichas/<slug>.json`. Ver `.claude/agents/demo-builder.md`.

## Idioma

Código y nombres técnicos en inglés o español según lo existente; textos para usuarios finales en español rioplatense (Uruguay).
