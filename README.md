# ReservasWeb

Páginas web a medida con reservas online para negocios de salud y estética: barberías, peluquerías, centros de estética, cosmetología, depilación y spas. Cada negocio tiene su propia web con su identidad y una agenda donde sus clientes reservan desde el celular, a cualquier hora. No es un marketplace: la web es del negocio.

> **Estado:** en desarrollo. Fase 0 (preparación) terminada; Fase 1 (vitrina) en curso.

## El problema

La mayoría de estos negocios no tiene web propia: viven en Instagram y WhatsApp, los turnos se piden por mensaje y se pierden o se superponen. Los que usan plataformas genéricas no muestran su marca. ReservasWeb les da una web propia, pensada para el celular, con reservas online que se gestionan solas.

## Cómo funciona

- **Una vitrina y webs a medida.** La página principal (`/`) muestra el trabajo y tiene botones a WhatsApp y mail para pedir una web. Los negocios llegan por contacto directo, no solos.
- **Un sistema, muchos negocios.** Por dentro todos comparten la misma instalación; cada uno ve solo lo suyo.
- **Hecho a medida por el operador.** Cada landing se arma a mano con los colores, servicios y estilo del negocio. Los dueños no configuran nada: solo ven y gestionan sus turnos.
- **Reglas en la base de datos.** La disponibilidad y la creación de reservas viven en funciones de Postgres, así un turno nunca se puede reservar dos veces, aunque dos personas lo intenten en el mismo segundo.

## Qué incluye la v1

- Vitrina en `/` con botones a WhatsApp y mail.
- Landing por negocio en `/[slug]`.
- Reserva en 4 pasos: servicio, día, horario y datos del cliente, con varios profesionales por negocio.
- Mail de confirmación con link para cancelar, y aviso al negocio.
- Panel del negocio: agenda del día y de la semana, cancelar turnos y bloquear horarios.
- Panel de operador: alta de negocios, servicios, profesionales y horarios.

**Para más adelante:** estadísticas, dominios propios, pagos online, reseñas y avisos por WhatsApp.

## Stack

| Capa | Tecnología |
| --- | --- |
| Web | Next.js (App Router), TypeScript, Tailwind |
| Datos y login | Supabase: Postgres con Row Level Security, Auth con link mágico |
| Mails | Resend |
| Hosting | Vercel |

## Hoja de ruta

- [x] **Fase 0:** preparación (repo, Next.js, Supabase, Vercel)
- [ ] **Fase 1:** vitrina con botones de contacto
- [ ] **Fase 2:** base de datos: limpiar el esquema existente, RLS y función `reservar()`
- [ ] **Fase 3:** cálculo de horarios libres
- [ ] **Fase 4:** landing y flujo público de reserva
- [ ] **Fase 5:** mails de confirmación y cancelación
- [ ] **Fase 6:** panel del negocio
- [ ] **Fase 7:** alta de negocios
- [ ] **Fase 8:** demo pública y primer cliente

## Desarrollo local

Requiere Node.js 20 o superior.

```bash
git clone https://github.com/LucasSechous/ReservasWeb.git
cd ReservasWeb
npm install
cp .env.example .env.local   # completar con los datos del proyecto de Supabase
npm run dev
```

Variables de entorno:

| Variable | Dónde se obtiene |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API Keys |

También se aceptan `NEXT_SUPABASE_URL` y `NEXT_SUPABASE_PUBLISHABLE_KEY` (los nombres cargados en Vercel).

Las claves nunca se suben al repo: todos los `.env` están en `.gitignore`.

## Estructura del repo

```
.claude/
  agents/demo-builder.md   agente de Claude Code que arma demos para prospectos
  commands/demo.md         comando /demo <slug>
demos/
  fichas/                  datos de marca de cada prospecto (entrada de las demos)
CLAUDE.md                  contexto y reglas del proyecto para Claude Code
```

## Demos para prospectos

Las maquetas para negocios interesados se generan con Claude Code: `/demo <slug>` toma la ficha en `demos/fichas/<slug>.json`, arma la demo y la sube en una rama `demo/<slug>` con su pull request. Vercel genera una vista previa por cada PR. Toda demo lleva una barra que aclara que es una maqueta y no el sitio oficial del negocio.

## Autor

Lucas Sechous ([Luckyrex](https://github.com/LucasSechous)), Maldonado, Uruguay.

Proyecto privado. Todos los derechos reservados.
