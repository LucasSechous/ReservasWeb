# ReservasWeb

Páginas web a medida con reservas online para barberías, peluquerías y centros de estética (Uruguay primero; después Argentina y Brasil). No es un marketplace: la web es de cada negocio, como una landing propia, y no un sitio donde el público elige entre negocios. La cara pública de ReservasWeb es una vitrina en `/` con demos y botones a WhatsApp y mail de Lucas. Lucas es el único operador: arma la landing de cada negocio a mano y les da de alta; los dueños no tienen panel de personalización. Los clientes salen del tracker de leads: Lucas los contacta, les pide permiso para mostrarles una demo y la arma en el momento.

Por dentro, todos los negocios comparten un solo proyecto y una sola base (decisión técnica interna, que el cliente final no ve).

## Stack (v1)

- Next.js (App Router) + TypeScript + Tailwind, en un solo proyecto desplegado en Vercel. Es Next 16 con Cache Components: antes de escribir código nuevo, ver `AGENTS.md` y la documentación en `node_modules/next/dist/docs/`.
- Supabase: Postgres con Row Level Security + Auth (link mágico). Sin backend aparte (no NestJS).
- Resend para mails transaccionales.

## Reglas de arquitectura

- Multi-negocio en una sola base, con RLS en todas las tablas. Toda tabla lleva `negocio_id`, salvo las de horarios, que cuelgan de `profesionales` (que sí lo lleva).
- Varios profesionales por negocio desde la v1; un negocio de una sola persona tiene un solo profesional.
- Las reglas críticas viven en la base: `reservar()` valida y crea reservas; `horarios_libres()` calcula disponibilidad. El frontend nunca inserta en `reservas` directo.
- Doble reserva imposible por restricción `EXCLUDE USING gist (profesional_id WITH =, rango WITH &&) WHERE (estado = 'confirmada')` con `btree_gist`. Los bloqueos son reservas con `origen = 'bloqueo'`.
- Fechas en `timestamptz`; se muestran en la zona del negocio (`America/Montevideo` por defecto).
- `precio_final` se copia en cada reserva.
- Nunca commitear claves: `.env*` está ignorado (menos `.env.example`). La `service_role` jamás en el cliente. El cliente de Supabase de `src/lib/supabase/server.ts` solo corre en el servidor y lee `NEXT_PUBLIC_SUPABASE_*` o, si no están, `NEXT_SUPABASE_*` (los nombres cargados en Vercel).
- El esquema de la base está en `supabase/migrations/` (Fase 2 aplicada el 28 de octubre de 2026), con un test en `supabase/tests/` y datos de prueba en `supabase/seed/`. Antes de cualquier migración que borre o cambie tablas o columnas, mostrar a Lucas el SQL y esperar su OK; cuando haya datos reales, respaldar primero. La herramienta de Supabase rechaza las sentencias destructivas (`drop`, `truncate`): en ese caso Lucas las pega en el SQL Editor.
- Permisos de tablas: los roles `anon` y `authenticated` reciben todos los permisos por defecto en tablas nuevas. Al crear una tabla en `public`, hacer `revoke all` y dar solo lo necesario; la RLS es la segunda barrera, no la única. Las funciones auxiliares van en el esquema `private`, no en `public`.

## Plan

El plan por fases (0 a 8) está en `docs/plan-v1.md`. Al terminar una tarea, tachala ahí (`[x]`). Trabajar una fase a la vez; cada fase termina con algo que se puede probar y Lucas la confirma antes de pasar a la siguiente.

## Forma de trabajar

- Flujo de ramas: `main` es producción y `develop` es donde se integra todo. Cada tarea va en una rama nueva que sale de `develop`, con commits chicos y mensajes claros, y se mergea a `develop` y se sube sin pedir permiso. Nunca se hace commit, merge ni `push` a `main`: solo sube cuando Lucas confirma que `develop` funciona perfecto y lo pide.
- Antes de algo grande o difícil de revertir (migraciones, cambios de esquema, borrar cosas), explicar qué se va a hacer y esperar su OK.

## Agentes de leads

Los agentes corren como rutinas programadas en la nube y se comunican a través del tracker de leads (un artefacto de Claude con su propia base), no en esta máquina. Ninguno envía mensajes a leads: todo queda como borrador para que Lucas lo mande.

## Demos para leads

Las maquetas para prospectos se arman con el subagente `demo-builder` (o el comando `/demo <slug>`). Las fichas de entrada están en `demos/fichas/<slug>.json`. Ver `.claude/agents/demo-builder.md`.

## Idioma

Código y nombres técnicos en inglés o español según lo existente; textos para usuarios finales en español rioplatense (Uruguay).
