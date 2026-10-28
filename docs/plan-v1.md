# Plan reservasWeb v1

Oct 27, 2026 · actualizado el 28 de octubre de 2026 · @Luckyrex

## Objetivo y alcance

ReservasWeb vende **páginas web a medida con reservas online** para negocios de salud y estética: barberías, peluquerías, centros de estética. Cada negocio tiene su propia web, con su identidad, donde sus clientes reservan desde el celular a cualquier hora. No es un marketplace donde el público elige entre negocios (como Fresha): la web es del negocio.

La cara pública de ReservasWeb es una **vitrina** en `/`: una landing tuya con demos y botones a tu WhatsApp y tu mail para pedir una web. Los clientes no llegan solos: los agentes encuentran leads, vos los contactás, pedís permiso para mostrarles una demo de su negocio y la armás en el momento.

La v1 es lo mínimo para venderle reservas a los primeros clientes que salgan del tracker de leads. Por dentro, todos los negocios comparten un solo proyecto y una sola base (más barato y simple de mantener); el cliente final nunca ve eso.

**Entra en la v1:**

- La vitrina en `/`, con botones a WhatsApp y mail.
- Una landing por negocio, en `/[slug]`, armada por vos sobre una plantilla compartida.
- Reserva en 4 pasos desde el celular: servicio, día, horario y datos del cliente. Si el negocio tiene varios profesionales, el cliente puede elegir uno o dejar que el sistema asigne el primero libre.
- Varios profesionales por negocio, cada uno con su agenda.
- Mail de confirmación al cliente, aviso al negocio y un link para cancelar.
- Panel del negocio: agenda del día y de la semana, cancelar turnos y bloquear horarios.
- Panel de operador para vos: alta de negocios, servicios, profesionales y horarios.

**Queda para después:** estadísticas, dominios propios, pagos online, avisos por WhatsApp, reseñas y personalización por parte del dueño.

## Arquitectura y stack

Un solo proyecto Next.js en Vercel, conectado a Supabase para datos y logins y a Resend para los mails. Sin servidor aparte.

```
Cliente o dueño ──► Next.js en Vercel ──► Supabase (Postgres + RLS, reservar(), horarios_libres(), Auth)
                    (vitrina, landings, └─► Resend (confirmación, cancelación, avisos)
                     reserva, paneles)
```

- **Next.js (App Router) con TypeScript y Tailwind:** la vitrina, las landings, el flujo de reserva y los dos paneles, en un solo deploy.
- **Supabase:** Postgres con RLS y Auth. Las reglas críticas, como validar y guardar una reserva o calcular horarios libres, son funciones dentro de la base. Así no dependen del frontend y no se pueden saltear.
- **Resend:** mails transaccionales.

Se deja de lado NestJS: para una persona sola, un segundo servidor duplica deploys y mantenimiento. Si algún día hace falta, las funciones de la base se reusan tal cual.

## Modelo de datos

La base vive en el proyecto de Supabase `reservasweb`. Partió de un intento anterior con solo datos de prueba, que se borraron el 28 de octubre de 2026, y ese mismo día la Fase 2 ajustó el esquema a este diseño. Hoy tiene cargada la «Barbería Demo» y quedan 2 usuarios de login de prueba en `auth.users`.

Ocho tablas en una sola base compartida, con Row Level Security para que cada negocio vea solo lo suyo. Las tablas de horarios no llevan `negocio_id` propio: cuelgan de `profesionales`, que sí lo lleva, y sus políticas RLS pasan por ahí.

| Tabla | Qué guarda | Campos clave |
| --- | --- | --- |
| `negocios` | Cada cliente tuyo | `slug`, `nombre`, `email`, `telefono`, `direccion`, `timezone`, `anticipacion_minutos`, `ventana_dias`, `activo` |
| `servicios` | Lo que se puede reservar | `negocio_id`, `nombre`, `descripcion`, `duracion_minutos`, `precio`, `activo` |
| `profesionales` | Quiénes atienden (un negocio de una persona tiene uno solo) | `negocio_id`, `nombre`, `foto_url`, `activo` |
| `profesional_servicios` | Qué servicios hace cada profesional | `profesional_id`, `servicio_id` |
| `horarios_disponibles` | Horario semanal de cada profesional (puede haber varios tramos por día, para el horario partido) | `profesional_id`, `dia_semana`, `hora_inicio`, `hora_fin` (`time`, hora local del negocio) |
| `horarios_excepciones` | Feriados, vacaciones o un día con horario especial | `profesional_id`, `fecha`, `disponible`, `hora_inicio`, `hora_fin`, `motivo` |
| `reservas` | Los turnos y los bloqueos | `negocio_id`, `profesional_id`, `servicio_id`, `rango` (tstzrange), `estado`, `origen`, `cliente_nombre`, `cliente_email`, `cliente_telefono`, `notas`, `precio_final`, `duracion_final_minutos`, `token_cancelacion` |
| `usuarios` | Quién entra al panel | `negocio_id` (vacío para el operador), `auth_user_id`, `email`, `nombre`, `rol` (`owner`, `staff`, `admin_plataforma`) |

**Bloqueos:** no hay tabla aparte. Bloquear una tarde es crear una reserva con `origen = 'bloqueo'`, y así la misma restricción anti-superposición lo cubre. `origen` puede ser `publico`, `manual` o `bloqueo`; `estado` puede ser `confirmada`, `cancelada`, `completada` o `no_show`.

**Reglas de acceso (RLS):**

- Cualquiera puede leer los negocios activos, sus servicios, profesionales y horarios: es lo que muestra la landing.
- Nadie crea reservas públicas directo en la tabla. Se crean solo con la función `reservar()`, que valida todo antes de guardar.
- Quien cancela desde el link del mail no tiene login: lo hace con la función `cancelar_reserva(token)` (`security definer`), que solo toca la reserva de ese token.
- Un dueño lee y cancela las reservas de su negocio, y crea reservas manuales y bloqueos.
- Vos, como operador (`admin_plataforma`), ves y editás todo. Hoy esa política no existe: se agrega en la Fase 2.

**Marca de cada negocio:** colores, fotos y textos de la landing viven en el código (un archivo por negocio), no en la base. Es lo más simple para la v1; se revisa si más adelante el alta tiene que ser sin deploy.

Dos decisiones que se mantienen del diseño original: `precio_final` se copia en cada reserva para que los números históricos no cambien si sube un precio, y las columnas de dominio propio se pueden agregar después sin romper nada.

## Motor de reservas

Los horarios libres se calculan al momento y la base de datos es la que impide dos turnos superpuestos para un mismo profesional, aunque dos personas reserven en el mismo segundo.

**Cómo se calculan los horarios libres** (función `horarios_libres(negocio, servicio, día)`, por profesional):

1. Tomar el horario de atención de ese profesional para ese día de la semana, o su excepción si hay una para esa fecha.
2. Restar las reservas confirmadas y los bloqueos.
3. Partir lo que queda en turnos de 15 minutos donde entre la duración completa del servicio.
4. Sacar los que no cumplen la anticipación mínima o caen fuera de la ventana de días del negocio.

Si el cliente no elige profesional, se muestra la unión de los horarios libres de todos los que hacen ese servicio.

**Cómo se evita la doble reserva:**

- Cada reserva guarda su `rango` de tiempo y la tabla tiene una restricción `EXCLUDE USING gist (profesional_id WITH =, rango WITH &&) WHERE (estado = 'confirmada')`, con la extensión `btree_gist` (ya instalada).
- Si dos personas eligen el mismo horario, la segunda recibe un error y la pantalla le muestra los horarios que siguen libres.
- La función `reservar()` vuelve a validar que el horario esté dentro de la atención, guarda `precio_final` y genera el `token_cancelacion`. Si no se indica profesional, prueba con cada uno que haga el servicio, en orden, y asigna el primero libre.

**Fechas y horas:** todo se guarda en `timestamptz` y se muestra en la zona del negocio (`America/Montevideo` por defecto), lo que deja listo el salto a Argentina o Brasil. Las reservas guardan un `rango` (`tstzrange`) y `reservar()` recibe un instante con zona horaria; los horarios de atención son `time` en hora local del negocio.

**Cancelación:** el mail trae un link con el token. `cancelar_reserva(token)` cambia el `estado` a `cancelada`, libera el horario y le avisa al negocio. Hoy solo permite cancelar turnos futuros; en la v1 no hay otro límite de tiempo, y si un negocio lo pide se agrega como regla.

**Bloqueos sobre turnos ya confirmados:** si el dueño bloquea un rango donde ya hay reservas, el panel avisa «hay N turnos en ese rango» y permite cancelarlos, con mail al cliente. Nunca se superponen en silencio.

**Reservas falsas:** `reservar()` es público, así que sin protección alguien podría llenar la agenda de un negocio. La Fase 4 suma un captcha (Cloudflare Turnstile, gratis) y un límite de reservas activas por mail y teléfono.

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

Nueve fases, una o dos por sesión de trabajo. Cada una termina con algo que se puede probar, y no se pasa a la siguiente hasta que eso funciona.

### Fase 0: Preparación

- [x] Crear el repo nuevo en GitHub, con `.env*` en el `.gitignore` desde el primer commit
- [x] Crear el proyecto Next.js (App Router, TypeScript, Tailwind)
- [x] Crear un proyecto nuevo en Supabase y conectar el conector a ese proyecto (se reutilizó el proyecto `reservasweb`, que ya tenía un esquema anterior con datos)
- [x] Conectar el repo a Vercel y cargar las variables de entorno
- [x] Chequeo de conexión: la página cuenta los negocios activos (no hizo falta una tabla de prueba)

**Terminada cuando:** la web vacía está online en Vercel y lee un dato de Supabase.

### Fase 1: Vitrina

- [x] Landing en `/` con propuesta, cómo trabajamos, los dos tipos de web y llamado a contactar
- [x] Botones a tu WhatsApp (+598 99 088 224) y a tu mail, con el mensaje ya armado
- [x] El chequeo de Supabase pasa a `/estado`, sin indexar
- [ ] Publicada en producción (Vercel, rama `main`)
- [ ] Sumar demos a la sección «Así se ve» a medida que existan

**Terminada cuando:** la vitrina está online y, desde el celular, los botones abren tu WhatsApp y tu mail.

### Fase 2: Base de datos

- [x] Borrar los datos de prueba que había (28 de octubre de 2026); las tablas quedaron vacías
- [x] Migración: borrar `resenas` y las columnas sin uso (`plan`, `buffer_minutos`, `descripcion`, `logo_url`)
- [x] Pasar `reservas` a `rango` (`timestamptz`), con la restricción anti-superposición por profesional
- [x] Reescribir `reservar()` y `cancelar_reserva()` para el nuevo `rango`
- [x] Política RLS del operador (`admin_plataforma`) y `usuarios.negocio_id` opcional para vos
- [x] Mover `auth_negocio_id()` a un esquema privado
- [x] Permisos mínimos sobre las tablas: el público solo lee lo de la landing (antes `anon` y `authenticated` tenían todos los permisos)
- [x] Datos de prueba: «Barbería Demo» con 3 servicios, 2 profesionales y horario partido

**Terminada cuando:** dos reservas superpuestas del mismo profesional hacen fallar a la segunda.

Terminada el 28 de octubre de 2026: la migración está en `supabase/migrations/`, los datos de prueba en `supabase/seed/` y el test de 10 casos en `supabase/tests/fase2_reservas.sql` (pasan los 10).

### Fase 3: Disponibilidad

- [x] Función `horarios_libres()` por profesional
- [x] Pruebas con horario partido, una excepción, un bloqueo, reservas existentes y dos profesionales

**Terminada cuando:** la función devuelve exactamente los turnos esperados en los casos de prueba.

Terminada el 28 de octubre de 2026: migración en `supabase/migrations/20261028010000_fase3_horarios_libres.sql` y test de 13 comprobaciones en `supabase/tests/fase3_horarios_libres.sql` (pasan todas).

### Fase 4: Reserva pública

- [x] Plantilla de landing en `/[slug]`
- [x] Flujo de 4 pasos en `/[slug]/reservar`, con elección de profesional solo si el negocio tiene más de uno
- [x] Pantalla de confirmación y manejo del error «ese horario se acaba de ocupar»
- [x] Captcha (Turnstile) y límite de reservas activas por mail y teléfono (el captcha se enciende al cargar `NEXT_PUBLIC_TURNSTILE_SITE_KEY` y `TURNSTILE_SECRET_KEY`; el límite ya funciona en la base, 3 activas por teléfono o mail)
- [x] Política de privacidad visible (Ley 18.331), como borrador a revisar antes del primer cliente

**Terminada cuando:** reservás un turno de punta a punta desde tu celular.

Hecha el 28 de octubre de 2026 y probada contra la base real (páginas, horarios, errores y permisos). **Falta tu prueba de punta a punta desde el celular**, que no pude hacer desde acá. Pendientes menores: `/[slug]` con un negocio que no existe responde 200 en vez de 404 (la página llega en streaming), y el tema visual de cada negocio nuevo se agrega a mano en `src/lib/tema.ts`.

### Fase 5: Mails

- [ ] Cerrar nombre y dominio del sistema (hace falta antes de verificar Resend) — **te toca a vos**
- [ ] Configurar Resend con un dominio verificado — **te toca a vos**: crear la cuenta, verificar el dominio y cargar `RESEND_API_KEY` y `MAIL_FROM` (ver `.env.example`)
- [x] Mail de confirmación con link de cancelación (código listo en `src/lib/mails.ts`; se envía cuando hay mail del cliente)
- [x] Aviso al negocio por cada reserva y cada cancelación (al `email` del negocio)
- [x] Página `/cancelar/[token]`

**Terminada cuando:** reservás, te llega el mail, cancelás desde el link y el horario vuelve a estar libre.

Código hecho el 28 de octubre de 2026. Probado contra la base real: la página de cancelar muestra el turno, lo cancela y libera el horario, y avisa si ya estaba cancelado o ya pasó. **El envío real de mails no se pudo probar** porque faltan las claves de Resend: sin `RESEND_API_KEY` la app no manda nada y todo lo demás funciona. En cuanto se carguen, conviene hacer una reserva de prueba con tu mail. Un detalle: el remitente de pruebas de Resend solo entrega al dueño de la cuenta, así que para mandar a clientes hace falta el dominio verificado.

### Fase 6: Panel del negocio

- [x] Login con link mágico de Supabase Auth (`/login`, `/auth/callback`, `/auth/salir`; la sesión se renueva en `src/proxy.ts`)
- [x] Agenda del día y de la semana, por profesional (`/panel`)
- [x] Cancelar turnos y bloquear horarios, avisando si el bloqueo pisa turnos confirmados (cancelar avisa por mail al cliente si dejó uno)

**Terminada cuando:** un dueño entra desde el celular, ve sus turnos y bloquea una tarde.

Código hecho el 28 de octubre de 2026. Las reglas de acceso se probaron en la base con sesiones simuladas (`supabase/tests/fase6_acceso_panel.sql`, 14 comprobaciones: cada dueño ve y toca solo lo suyo, el operador ve todo, el público no lee reservas). **Falta tu prueba real de punta a punta**, que no pude hacer sin tu casilla de mail. Antes de probar:
- En Supabase → Authentication → URL Configuration, agregar `http://localhost:3000/**` y la URL de Vercel con `/**` como *Redirect URLs*.
- El mail del link mágico sale de Supabase, que en el plan gratis manda muy pocos por hora y con remitente genérico. Para producción conviene configurar el envío con Resend (Authentication → SMTP Settings) una vez que haya dominio.
- La primera vez que entres con `sechouslucasuy@gmail.com` quedás como operador (`completar_perfil()`). A un dueño se lo invita creando su usuario con su mail (Fase 7).
- Quien pide un link sin estar invitado recibe el mail igual, pero al entrar ve «Tu cuenta no tiene un panel»; no se revela qué mails están dados de alta.

### Fase 7: Alta de negocios

- [x] Panel de operador para crear un negocio con servicios, profesionales y horarios (`/operador` y `/operador/nuevo`; invita al dueño por mail y permite activar o desactivar negocios)
- [x] Cargar la landing y las fotos de cada negocio (la landing sale sola de la plantilla; los colores van en `src/lib/tema.ts` y la foto de portada opcional en `public/negocios/<slug>/`)

**Terminada cuando:** das de alta un negocio nuevo en menos de 30 minutos.

Código hecho el 28 de octubre de 2026. `crear_negocio()` se probó en la base con sesiones simuladas (`supabase/tests/fase7_crear_negocio.sql`, 13 comprobaciones): solo el operador puede usarla, crea todo en una sola transacción sin dejar nada a medias, rechaza slugs reservados o repetidos, y el negocio nuevo ya ofrece turnos para reservar. **Falta tu prueba real** (entrar con tu mail como operador y dar de alta uno). Límites a propósito de esta primera versión: todos los profesionales de un negocio nuevo hacen todos los servicios y comparten el mismo horario; para cambiar eso, o editar un servicio o un horario, por ahora se usa el panel de Supabase.

### Fase 8: Demo y primer cliente

- [x] «Barbería Demo» pública para las demos de los leads, enlazada desde la vitrina (tarjeta «En vivo» en `/`, y un cartel fijo de «esto es una demo» en `/barberia-demo`; sin mail del negocio para que no salgan avisos)
- [ ] Pasar Vercel y Supabase a los planes pagos — **te toca a vos**, no lo puedo hacer yo
- [ ] Primer cliente real dado de alta — **te toca a vos**, desde `/operador/nuevo`

**Terminada cuando:** un cliente real recibe reservas de sus clientes.

Hecho el 28 de octubre de 2026 lo que depende del código. Cuando la demo esté publicada en producción, el botón «Reservar» de las demos de los agentes puede apuntar a `/barberia-demo/reservar` (hay que actualizar el prompt del agente de demos con la dirección pública). La demo recibe reservas de prueba de quien la use: conviene limpiarlas de vez en cuando desde el panel de Supabase.

## Conexión con los agentes

reservasWeb cierra el embudo que ya funciona: lead, demo, cliente, negocio online. Los agentes corren como rutinas programadas en la nube y se comunican a través del tracker de leads. Ninguno envía mensajes a un lead: todo queda como borrador para que lo mandes vos. Cada paso nuevo se suma cuando su fase está terminada.

| Cuándo | Qué cambia | Agente |
| --- | --- | --- |
| Después de la Fase 1 | Los mensajes a leads pueden incluir el link de la vitrina como muestra de tu trabajo | Leads |
| Después de la Fase 4 | Las demos usan el mismo diseño que la plantilla de landing | Demos para leads |
| Después de la Fase 8 | El botón «Reservar» de cada demo lleva a la Barbería Demo, donde se puede reservar de verdad | Demos para leads |
| Después de la Fase 8 | Los mensajes ofrecen el plan con reservas: turnos las 24 horas, sin superposiciones, con confirmación por mail | Leads |
| Después de la Fase 7 | Al marcar un lead como «Cerrado», se prepara el alta: negocio y servicios desde su ficha de marca, más su landing. Vos revisás, cargás precios y fotos | Alta de clientes (nuevo) |
| Cuando haya paquetes y precios | Al pasar un lead a «respondió» o «reunión», se redacta una propuesta con alcance, plazos y precio | Propuestas (nuevo) |

La ficha de marca del tracker es el puente: los servicios, colores y estilo que juntan los agentes son los mismos datos que después se cargan en reservasWeb.

Con varios profesionales en la v1, la rúbrica de calificación de leads ya no tiene por qué penalizar a los negocios con 4 o más profesionales: pasan a encajar.

## Decisiones pendientes y riesgos

**Decididas:**

- [x] Varios profesionales por negocio desde la v1 (28 de octubre de 2026): el esquema ya lo soporta y evita migrar después una tabla con reservas reales.
- [x] ReservasWeb es una vitrina y webs a medida, no un marketplace (28 de octubre de 2026).

**A decidir:**

- [ ] Precios de cada nivel: landing simple y landing con reservas (armado más mensualidad)
- [ ] Nombre y dominio del sistema (a más tardar antes de la Fase 5)
- [ ] Si cada cliente tiene su dominio propio desde el inicio o queda en `tudominio.com/su-negocio`

**Riesgos:**

- **La vitrina promete funciones que todavía no existen.** La tarjeta «Landing con reservas» habla de reserva online, mails y agenda, que llegan en las Fases 4 a 6. Hasta entonces conviene vender solo lo que ya está o bajar el tono del texto.
- **Vercel Hobby y las demos.** El plan gratis es solo para uso no comercial y las demos para leads son prospección. Riesgo chico, pero si hay reclamo se pasa a Pro antes.
- **Datos personales.** Vas a guardar nombre, mail y teléfono de los clientes de tus clientes. La Ley 18.331 de Uruguay pide una política de privacidad visible y usar esos datos solo para las reservas. Esto entra en la Fase 4.
- **Plan gratis en producción.** Sin backups ni uso comercial permitido. El paso a planes pagos está en la Fase 8 y no se saltea.
- **Vos sos el único soporte.** Si algo se cae un sábado, te llaman a vos. Conviene activar alertas de errores en Vercel antes del primer cliente.
