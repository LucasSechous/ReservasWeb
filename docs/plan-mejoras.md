# Plan de mejoras (30 de octubre de 2026)

Cinco puntos acordados después de cerrar el panel v2. Cada uno tiene: **objetivo** (para qué), **meta** (cómo sabemos que está), **opciones** con su recomendación, **qué se hizo** y **qué falta**. Los precios de los planes son aproximados: confirmalos en la página de cada servicio antes de pagar.

Estado de un vistazo:

| # | Punto | Estado |
|---|-------|--------|
| 1 | Probar lo que ya está construido | Preparado. Falta tu recorrido de 15 minutos |
| 2 | Que el producto cumpla lo que promete la vitrina | Hecho en `develop`. Falta cargar la demo de clínica |
| 3 | Base lista para el primer cliente que pague | Hecho lo técnico. Faltan decisiones de planes y claves |
| 4 | Pruebas automáticas | Hecho |
| 5 | Armar webs más rápido | Hecho. Siguiente escalón cuando haya más clientes |

---

## 1. Probar lo que ya está construido

**Objetivo.** Saber que el panel funciona en la vida real, con un celular en la mano, antes de mostrárselo a un cliente.

**Meta.** Los 12 pasos de [prueba-panel.md](prueba-panel.md) salen bien en el celular, sin errores graves.

**Opciones.**

- **A. Lo probás vos solo (15 minutos).** Es lo más rápido y encuentra la mayoría de los problemas.
- **B. Lo probás con un dueño piloto**, por ejemplo el primer lead que acepte una demo gratis. Encuentra problemas de uso que vos ya no ves, pero depende de conseguir a alguien.
- **C. Pruebas automáticas de navegador (Playwright)** con una cuenta de prueba. Vale la pena cuando haya muchos cambios seguidos; hoy es más trabajo que beneficio.

**Recomendación.** A ahora y B con el primer cliente real.

**Qué se hizo.**

- Se encontró y corrigió la causa del timeout de los turnos de ejemplo: un bucle infinito por usar `random()` dentro de un `WHERE`. El script corregido termina en segundos.
- Guía de prueba con los 12 pasos y qué tiene que pasar en cada uno.
- Se comprobó sin sesión que las zonas privadas están cerradas: `/panel`, `/operador` y `/cambiar-contrasena` mandan a `/login`, y `/api/recordatorios` responde 401 sin la clave.
- La prueba de base del panel (ver punto 4) confirma que las reservas a mano y los bloqueos se comportan bien en la base.

**Qué falta (de tu lado).**

1. `node scripts/asignar-contrasena.mjs sechouslucasuy@gmail.com operador` y entrar a la vista previa de `develop`.
2. Pegar `supabase/seed/turnos_de_ejemplo.sql` en el SQL Editor (a mí no me dejaron ejecutarlo).
3. Recorrer la guía.

**Límite.** No pude iniciar sesión, así que las pantallas del panel no las vi funcionando.

---

## 2. Que el producto cumpla lo que promete la vitrina

**Objetivo.** La vitrina ahora ofrece webs para clínicas, consultorios, veterinarias, gimnasios y más. El producto tiene que hablar como cada rubro: «especialista» y «consulta» en una clínica, «entrenador» y «clase» en un gimnasio.

**Meta.** Una clínica ve sus propias palabras en la landing, la reserva, el link de gestión y el resumen del panel, sin que cambie nada para los negocios que ya existen.

**Opciones.**

- **A. Vocabulario por rubro dentro del código, en el tema de cada negocio.** No toca la base. Cada alta nueva agrega una línea (`rubro: "salud"`). *Elegida.*
- **B. Vocabulario guardado en la base y editable por el dueño.** Más flexible, pero necesita una migración y una pantalla de edición. Conviene cuando haya unos 5 a 10 clientes.
- **C. Textos completamente a medida por negocio.** Máxima libertad, pero cada cliente es un trabajo aparte.

**Recomendación.** A ahora; B cuando el alta por código empiece a pesar (ver punto 5).

**Qué se hizo.**

- Siete rubros con sus palabras: barbería, belleza, salud, bienestar, mascotas, entrenamiento y estudio profesional. Sin rubro, todo queda como antes.
- Aplicado en la landing (cantidad de «especialistas», título del equipo), la reserva (pasos y preguntas), la gestión del turno y el resumen del panel.
- **Demo de clínica** (`clinica-demo`): tema en estilo claro y verde azulado, logo, y datos de ejemplo en `supabase/seed/clinica_demo.sql` con tres especialistas que hacen cada uno solo algunas consultas. El SQL se validó contra la base (se revierte al terminar).
- **Privacidad:** la política ahora dice que se guarda la asistencia y que el negocio puede recibir un aviso por ausencias repetidas, menciona el recordatorio por mail y suma una sección sobre servicios de salud (no escribir información clínica en la reserva). La reserva pública no tiene campo de notas, así que ese riesgo no existe ahí.

**Qué falta.**

- Correr `clinica_demo.sql` en el SQL Editor. Después me avisás y agrego la tarjeta de la demo en la vitrina (es una línea; no la puse antes porque quedaría un enlace roto).
- **Revisión legal.** La política de privacidad es un borrador basado en la Ley 18.331. Conviene que la lea una persona con conocimiento legal antes del primer cliente, sobre todo en salud.
- Algunos textos secundarios siguen genéricos («turno», «servicio» en los mails y en el panel). Para una clínica es aceptable; se pueden ajustar si un cliente lo pide.
- El campo de notas del panel (privado del negocio) permite escribir cualquier cosa. Para salud, conviene decirle al dueño que no anote diagnósticos.

---

## 3. Base lista para el primer cliente que pague

**Objetivo.** Que una falla de infraestructura no te deje mal parado con alguien que paga: perder datos, que la base se pause, o enterarte de una caída por el cliente.

**Meta.** Respaldos disponibles, aviso automático si la web se cae, mails y recordatorios funcionando, y ningún servicio gratuito que se pause o que no permita uso comercial.

**Opciones y recomendación por tema.**

| Tema | Hoy | Opciones | Recomendación |
|------|-----|----------|---------------|
| **Vercel** | Plan gratuito (Hobby): sus términos lo limitan a uso personal, no comercial | Pasar a Pro (aprox. US$20 por mes) | Pasar a Pro al firmar el primer cliente |
| **Supabase** | Plan gratuito: no hace respaldos automáticos y pausa el proyecto tras una semana sin actividad | Pro (aprox. US$25 por mes): respaldos diarios y sin pausa | Pasar a Pro al firmar el primer cliente. Mientras tanto, respaldo propio semanal |
| **Aviso de caídas** | Nada | UptimeRobot (gratis, revisa cada 5 minutos y avisa por mail); Better Stack (gratis, con más funciones) | UptimeRobot apuntando a `/api/salud` |
| **Mails** | Apagados (falta la clave de Resend) | Resend gratis: 3.000 mails por mes alcanza de sobra al principio | Activarlo con tu dominio, siguiendo `docs/mails-resend.md` |
| **Claves de contraseñas filtradas** | Apagado en Supabase | Se activa en Authentication; en general exige el plan Pro | Activarlo al pasar a Pro |

**Qué se hizo.**

- **Migración de recordatorios aplicada** (suma una columna opcional; no cambia nada existente).
- **`CRON_SECRET` cargado en Vercel** como variable sensible, solo en producción. Habilita la tarea diaria de recordatorios a las 9:00.
- **Respaldo propio:** `node scripts/respaldo.mjs` baja todas las tablas a `respaldos/AAAA-MM-DD/` (ignorada por git). Ya se hizo una primera copia. Conviene correrlo una vez por semana y copiar la carpeta fuera de la computadora.
- **`/api/salud`:** responde 200 si la web y la base andan, y 503 si no. Sirve para el monitor externo. Además, como la consulta toca la base, evita que Supabase la pause por inactividad mientras alguien la consulte.
- **Revisión de seguridad de Supabase.** Los avisos de `reservar` y `horarios_libres` ejecutables sin sesión son intencionales: son las funciones de la reserva pública. Lo demás es menor (cuatro claves foráneas sin índice y políticas que se pueden unificar), sin impacto real con pocos datos. Conviene revisarlo cuando haya miles de reservas.

**Qué falta (de tu lado).**

1. Cargar en Vercel `RESEND_API_KEY`, `MAIL_FROM` y `NEXT_PUBLIC_SITE_URL` (la clave que pegaste en el chat antes, regenerala).
2. Crear el monitor en UptimeRobot con la dirección `https://<tu dominio>/api/salud`.
3. Elegir cuándo pasar a los planes pagos.
4. **Subir a `main`.** Los recordatorios, el login nuevo y todo el panel solo existen en `develop`. Hasta que lo confirmes y lo pidas, producción sigue como estaba y la tarea diaria no corre.

---

## 4. Pruebas automáticas

**Objetivo.** Poder cambiar el código sin romper las reservas, y enterarse al instante si algo se rompió.

**Meta.** Cada regla crítica tiene una prueba que corre en menos de un minuto, y ninguna subida llega a `develop` sin que corran lint, tipos y pruebas.

**Opciones.**

- **A. Pruebas de la lógica pura (Vitest) y de las reglas de la base (scripts SQL que se revierten solos).** *Hecho.*
- **B. Integración continua en GitHub:** corre lint, tipos y pruebas en cada subida, sin costo. *Hecho.*
- **C. Pruebas de navegador de punta a punta (Playwright).** Útil cuando haya clientes y cambios frecuentes; hoy requiere mantener una cuenta de prueba en producción.
- **D. Que las pruebas de base corran solas.** Exige Supabase local con Docker o una conexión directa a la base. Mucho esfuerzo para el beneficio actual.

**Recomendación.** A y B ahora; C después de los primeros clientes; D probablemente nunca.

**Qué se hizo.**

- **45 pruebas de lógica** que corren en menos de un segundo (`npm test`): reconocimiento de clientes (teléfono, mail, nombre), fechas en hora de Montevideo, tokens de gestión (el token nunca se guarda en claro), contraseñas provisorias, vocabulario por rubro, dominios propios y mails.
- **Prueba nueva de base del panel** (`supabase/tests/panel_v2.sql`), con 9 verificaciones que pasaron: el público no puede insertar ni leer reservas directo, una reserva a mano no puede pisar a una pública, cancelar libera el horario, el ciclo vino / no vino / deshacer, y los bloqueos y las reservas a mano se reflejan en la web pública.
- **Integración continua** en `.github/workflows/ci.yml`: lint, tipos y pruebas en cada subida. Se simuló en una copia limpia del repositorio y pasó.

**Qué falta.** Las otras seis pruebas de base (fases 2, 3, 4, 6, 7 y gestión de reserva) no las volví a correr hoy. Se corren pegándolas en el SQL Editor, y conviene hacerlo una vez antes de subir a `main`.

---

## 5. Armar webs más rápido

**Objetivo.** Bajar el tiempo de alta de un cliente (hoy, buena parte de una hora) para poder atender más negocios siendo el único operador.

**Meta.** Un negocio nuevo funcionando, con servicios, horario y dueño, en menos de 15 minutos (sin contar fotos y marca).

**Opciones.**

- **A. Plantillas por rubro en el alta**, más el tema en el código. *Hecho.*
- **B. Tema, rubro y dominio guardados en la base, con un editor en `/operador`.** El alta sería 100 % desde el navegador, sin tocar el código ni hacer un deploy. Necesita una migración (columnas nuevas en `negocios`) y una pantalla. Conviene a partir de unos 5 clientes.
- **C. Generar la landing con el agente `demo-builder`** a partir de una ficha. Ya existe y sirve para las demos de prospectos; para clientes confirmados, el tema en código (A) da más control.

**Recomendación.** A hasta los primeros 5 clientes; después B. Antes de B te muestro el SQL y espero tu OK, como pide el proyecto.

**Qué se hizo.**

- **12 plantillas** en el formulario de alta (barbería, peluquería, estética, uñas y pestañas, clínica, odontología, nutrición o psicología, kinesiología, veterinaria, entrenamiento, estudio profesional y tatuajes): cargan servicios con precios de ejemplo, el horario típico y los plazos de anticipación. Se ajusta todo a mano después.
- **Dominio propio:** `src/lib/dominios.ts` asocia un dominio a un negocio, y el proxy muestra su landing y su reserva en esa dirección. Se probó de punta a punta en local (con un dominio de prueba que luego se quitó) y sin dominios cargados no cambia nada. Paso a paso en [dominios-propios.md](dominios-propios.md).

**Qué falta.** El alta de un cliente todavía tiene un paso en código: agregar su tema (colores, rubro) en `src/lib/tema.ts` y, si tiene dominio propio, una línea en `dominios.ts`. Es el motivo de la opción B.

---

## Costos mensuales aproximados al empezar a cobrar

| Concepto | Costo |
|----------|-------|
| Vercel Pro | aprox. US$20 |
| Supabase Pro | aprox. US$25 |
| Resend (plan gratuito) | US$0 |
| Monitor de caídas (UptimeRobot gratis) | US$0 |
| Dominios propios de los clientes | A cargo de cada cliente |
| **Total fijo** | **aprox. US$45 por mes**, que se cubre con el primer o segundo cliente |
