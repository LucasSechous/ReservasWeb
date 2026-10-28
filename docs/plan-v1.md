# Plan reservasWeb v1

Oct 27, 2026 · @Luckyrex

## Objetivo y alcance

La v1 permite que un negocio reciba reservas online desde su propia landing y las gestione en un panel simple. Es lo mínimo para venderle reservas a los primeros clientes que salgan del tracker de leads.

**Entra en la v1:**

- Una landing por negocio, en `/[slug]`, armada por vos sobre una plantilla compartida.
- Reserva en 4 pasos desde el celular: servicio, día, horario y datos del cliente.
- Mail de confirmación al cliente, aviso al negocio y un link para cancelar.
- Panel del negocio: agenda del día y de la semana, cancelar turnos y bloquear horarios.
- Panel de operador para vos: alta de negocios, servicios y horarios.

**Queda para después:** varios profesionales con agenda propia, estadísticas, dominios propios, pagos online, avisos por WhatsApp y personalización por parte del dueño.

## Arquitectura y stack

Un solo proyecto Next.js en Vercel, conectado a Supabase para datos y logins y a Resend para los mails. Sin servidor aparte.

```
Cliente o dueño ──► Next.js en Vercel ──► Supabase (Postgres + RLS, reservar(), horarios_libres(), Auth)
                    (landing, reserva,  └─► Resend (confirmación, cancelación, avisos)
                     paneles)
```

- **Next.js (App Router) con TypeScript y Tailwind:** las landings, el flujo de reserva y los dos paneles, en un solo deploy.
- **Supabase:** Postgres con RLS y Auth. Las reglas críticas, como validar y guardar una reserva o calcular horarios libres, son funciones dentro de la base. Así no dependen del frontend y no se pueden saltear.
- **Resend:** mails transaccionales.

Se deja de lado NestJS: para una persona sola, un segundo servidor duplica deploys y mantenimiento. Si algún día hace falta, las funciones de la base se reusan tal cual.

## Modelo de datos

Seis tablas en una sola base compartida, con `negocio_id` en todas y Row Level Security para que cada negocio vea solo lo suyo.

| Tabla | Qué guarda | Campos clave |
| --- | --- | --- |
| `negocios` | Cada cliente tuyo | `slug`, `nombre`, `zona_horaria`, `anticipacion_min`, `ventana_dias`, `activo` |
| `servicios` | Lo que se puede reservar | `negocio_id`, `nombre`, `duracion_min`, `precio`, `activo` |
| `horarios` | Horario semanal de atención | `negocio_id`, `dia_semana`, `abre`, `cierra` |
| `bloqueos` | Feriados, vacaciones, huecos | `negocio_id`, `rango` (tstzrange), `motivo` |
| `reservas` | Los turnos | `negocio_id`, `servicio_id`, `rango` (tstzrange), `estado`, `cliente_nombre`, `cliente_email`, `cliente_tel`, `precio_final`, `token_cancelacion` |
| `miembros` | Quién entra al panel | `negocio_id`, `user_id`, `rol` (operador o dueño) |

**Reglas de acceso (RLS):**

- Cualquiera puede leer los negocios activos, sus servicios y horarios: es lo que muestra la landing.
- Nadie crea reservas directo en la tabla. Se crean solo con la función `reservar()`, que valida todo antes de guardar.
- Un dueño lee y cancela las reservas de su negocio. Vos, como operador, ves y editás todo.

Dos decisiones que se mantienen del diseño original: `precio_final` se copia en cada reserva para que los números históricos no cambien si sube un precio, y las columnas de dominio propio se pueden agregar después sin romper nada.

## Motor de reservas

Los horarios libres se calculan al momento y la base de datos es la que impide dos turnos superpuestos, aunque dos personas reserven en el mismo segundo.

**Cómo se calculan los horarios libres** (función `horarios_libres(negocio, servicio, día)`):

1. Tomar el horario de atención de ese día de la semana.
2. Restar los bloqueos y las reservas confirmadas.
3. Partir lo que queda en turnos de 15 minutos donde entre la duración completa del servicio.
4. Sacar los que no cumplen la anticipación mínima o caen fuera de la ventana de días del negocio.

**Cómo se evita la doble reserva:**

- Cada reserva guarda su `rango` de tiempo y la tabla tiene una restricción `EXCLUDE USING gist (negocio_id WITH =, rango WITH &&) WHERE (estado = 'confirmada')`, con la extensión `btree_gist`.
- Si dos personas eligen el mismo horario, la segunda recibe un error y la pantalla le muestra los horarios que siguen libres.
- La función `reservar()` vuelve a validar que el horario esté dentro de la atención y no esté bloqueado, guarda `precio_final` y genera el `token_cancelacion`.

**Fechas y horas:** todo se guarda en `timestamptz` y se muestra en la zona del negocio (`America/Montevideo` por defecto), lo que deja listo el salto a Argentina o Brasil.

**Cancelación:** el mail trae un link con el token. Cancelar cambia el `estado` a `cancelada`, libera el horario y le avisa al negocio. En la v1 no hay límite de tiempo para cancelar; si un negocio lo pide, se agrega como regla.

## Hosting y costos

Desarrollar sale USD 0. Con el primer cliente que paga hay que pasar a planes pagos: unos USD 45 por mes en total, que se reparten entre todos los negocios porque comparten la misma instalación.

| Servicio | Para qué | Mientras desarrollás | Con clientes reales |
| --- | --- | --- | --- |
| [Vercel](https://vercel.com/docs/plans/hobby) | La web en Next.js | Hobby, USD 0. Solo uso personal, no comercial | Pro, USD 20 por mes por desarrollador |
| [Supabase](https://supabase.com/pricing.md) | Base de datos y logins | Free, USD 0: 500 MB, sin backups, se pausa tras 1 semana sin uso | Pro, desde USD 25 por mes: backups diarios, nunca se pausa |
| [Resend](https://resend.com/pricing.md) | Mails de confirmación | Free, USD 0: 3.000 mails por mes, 100 por día | Sigue gratis hasta superar eso; Pro USD 20 por mes con 50.000 |
| Dominio | La dirección del sistema | Una URL de Vercel | Un dominio propio, costo anual a confirmar |

El salto a pago no es opcional: el plan gratis de Vercel prohíbe el uso comercial, y en Supabase gratis no hay backups de las reservas de tus clientes. Con 2 o 3 clientes en el plan con reservas, la mensualidad que cobres debería cubrir este costo fijo.

## Fases paso a paso

Siete fases, una o dos por sesión de trabajo. Cada una termina con algo que se puede probar, y no se pasa a la siguiente hasta que eso funciona.

### Fase 0: Preparación

- [x] Crear el repo nuevo en GitHub, con `.env*` en el `.gitignore` desde el primer commit
- [ ] Crear el proyecto Next.js (App Router, TypeScript, Tailwind)
- [x] Crear un proyecto nuevo en Supabase y conectar el conector a ese proyecto
- [ ] Conectar el repo a Vercel y cargar las variables de entorno

**Terminada cuando:** la web vacía está online en Vercel y lee un dato de Supabase.

### Fase 1: Base de datos

- [ ] Migración con las seis tablas y la extensión `btree_gist`
- [ ] Restricción anti-superposición en `reservas`
- [ ] Políticas RLS de lectura pública, dueño y operador
- [ ] Función `reservar()` con sus validaciones
- [ ] Datos de prueba: un negocio «Barbería Demo» con 3 servicios y horario

**Terminada cuando:** dos reservas superpuestas en SQL hacen fallar a la segunda.

### Fase 2: Disponibilidad

- [ ] Función `horarios_libres()`
- [ ] Pruebas con horario partido, un bloqueo y reservas existentes

**Terminada cuando:** la función devuelve exactamente los turnos esperados en los casos de prueba.

### Fase 3: Reserva pública

- [ ] Plantilla de landing en `/[slug]`
- [ ] Flujo de 4 pasos en `/[slug]/reservar`
- [ ] Pantalla de confirmación y manejo del error «ese horario se acaba de ocupar»

**Terminada cuando:** reservás un turno de punta a punta desde tu celular.

### Fase 4: Mails

- [ ] Configurar Resend con un dominio verificado
- [ ] Mail de confirmación con link de cancelación
- [ ] Aviso al negocio por cada reserva y cada cancelación
- [ ] Página `/cancelar/[token]`

**Terminada cuando:** reservás, te llega el mail, cancelás desde el link y el horario vuelve a estar libre.

### Fase 5: Panel del negocio

- [ ] Login con link mágico de Supabase Auth
- [ ] Agenda del día y de la semana
- [ ] Cancelar turnos y bloquear horarios

**Terminada cuando:** un dueño entra desde el celular, ve sus turnos y bloquea una tarde.

### Fase 6: Alta de negocios

- [ ] Panel de operador para crear un negocio con servicios y horarios
- [ ] Cargar la landing y las fotos de cada negocio

**Terminada cuando:** das de alta un negocio nuevo en menos de 30 minutos.

### Fase 7: Demo y primer cliente

- [ ] «Barbería Demo» pública para las demos de los leads
- [ ] Pasar Vercel y Supabase a los planes pagos
- [ ] Primer cliente real dado de alta

**Terminada cuando:** un cliente real recibe reservas de sus clientes.

## Conexión con los agentes

reservasWeb cierra el embudo que ya funciona: lead, demo, cliente, negocio online. Cada paso nuevo se suma cuando su fase está terminada.

| Cuándo | Qué cambia | Agente |
| --- | --- | --- |
| Después de la Fase 3 | Las demos usan el mismo diseño que la plantilla de landing | Demos para leads |
| Después de la Fase 7 | El botón «Reservar» de cada demo lleva a la Barbería Demo, donde se puede reservar de verdad | Demos para leads |
| Después de la Fase 7 | Los mensajes ofrecen el plan con reservas: turnos las 24 horas, sin superposiciones, con confirmación por mail | Leads |
| Después de la Fase 6 | Al marcar un lead como «Cerrado», se prepara el alta: negocio y servicios desde su ficha de marca, más su landing. Vos revisás, cargás precios y fotos | Alta de clientes (nuevo) |

La ficha de marca del tracker es el puente: los servicios, colores y estilo que juntan los agentes son los mismos datos que después se cargan en reservasWeb.

## Decisiones pendientes y riesgos

El riesgo más grande es que la v1 tiene una sola agenda por negocio, y varios de los mejores leads tienen varios profesionales.

**A decidir:**

- [ ] Precios de cada nivel: landing simple y landing con reservas (armado más mensualidad)
- [ ] Nombre y dominio del sistema
- [ ] Si el cliente elige profesional en la v1 o se espera a la v2

**Riesgos:**

- **Varios profesionales.** Barberías como Don Sixto o Azes tienen 4 o 5 barberos. Con una sola agenda, solo se puede reservar un turno a la vez en todo el negocio. Mientras no esté la v2, conviene ofrecer el plan con reservas a negocios de 1 o 2 personas.
- **Datos personales.** Vas a guardar nombre, mail y teléfono de los clientes de tus clientes. La Ley 18.331 de Uruguay pide una política de privacidad visible y usar esos datos solo para las reservas. Esto entra en la Fase 3.
- **Plan gratis en producción.** Sin backups ni uso comercial permitido. El paso a planes pagos está en la Fase 7 y no se saltea.
- **Vos sos el único soporte.** Si algo se cae un sábado, te llaman a vos. Conviene activar alertas de errores en Vercel antes del primer cliente.
