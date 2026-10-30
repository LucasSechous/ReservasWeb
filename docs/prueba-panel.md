# Prueba del panel (Fase 9) — guía de 15 minutos

Para recorrer el panel nuevo antes de mostrárselo a un cliente. Hacela en la vista previa de Vercel de `develop` (la producción, `main`, todavía tiene el login viejo).

## Antes de empezar (una sola vez)

1. **Tu contraseña de operador.** En la terminal, dentro del proyecto:
   `node scripts/asignar-contrasena.mjs sechouslucasuy@gmail.com operador`
   Imprime una contraseña provisoria. Entrá con tu mail y esa contraseña; el sistema te pide cambiarla.
2. **Turnos de ejemplo.** Pegá `supabase/seed/turnos_de_ejemplo.sql` en el SQL Editor de Supabase y ejecutalo. Tarda unos segundos. (Antes se colgaba por un error del script; ya está corregido.)
3. **Demo de clínica** (opcional): pegá `supabase/seed/clinica_demo.sql` en el SQL Editor y abrí `/clinica-demo` para ver cómo habla un negocio de salud («especialistas», «consulta»).
4. **Recordatorios:** la migración y el `CRON_SECRET` ya están cargados. Solo faltan las claves de Resend (ver `docs/plan-mejoras.md`, punto 3), y la tarea diaria corre únicamente en producción (`main`).

## Recorrido

Hacelo con el celular en la mano (o la vista de celular del navegador): es donde más se va a usar.

| # | Qué hacer | Qué tiene que pasar |
|---|-----------|---------------------|
| 1 | Entrar con mail y contraseña | Si es la provisoria, te manda a cambiarla. Después, a `/operador` |
| 2 | Abrir el negocio `barberia-demo` desde el operador | Entra al panel del negocio. Arriba (o abajo en el celu) están Hoy, Agenda, Clientes, Resumen |
| 3 | **Hoy**: mirar la tarjeta del próximo turno | Muestra cliente, servicio, "en X min", y tres contadores |
| 4 | **Agendar** (botón verde): servicio → con quién → día y hora → solo el nombre | El turno queda en la agenda. Los horarios ocupados no aparecen |
| 5 | Agendar sin teléfono ni mail | Tiene que dejarte (solo el nombre es obligatorio) |
| 6 | **Agenda**: cambiar de día a semana, bloquear un horario | El bloqueo aparece rayado y ese horario desaparece para el público |
| 7 | En un turno ya pasado: tocar **✓ Sí, vino** y en otro **✗ No vino** | Cambia la etiqueta; "Me equivoqué, deshacer" lo revierte |
| 8 | **Cancelar un turno** | Pide confirmar en el mismo lugar, sin ventana emergente |
| 9 | **Resumen**: mes actual y mes anterior | ✓ se presentaron / ✗ no se presentaron, ingresos, lo más pedido |
| 10 | **Clientes**: buscar por nombre | Aparece el historial con ✓ y ✗ |
| 11 | Botón **Salir** (como operador) | Cierra la sesión (no te manda a tu panel) |
| 12 | Entrar a `/barberia-demo` desde otra ventana y reservar un turno | Aparece enseguida en la agenda del panel |

## Si algo falla

Anotá el número del paso y qué viste (o una captura) y pasámelo. Lo más probable de encontrar:

- Textos cortados o botones chicos en el celular.
- Un horario que ofrece el panel y la web pública no (o al revés). Los dos salen de la misma función de la base, así que sería un error serio.
- Un turno que no cambia de estado al marcarlo.
