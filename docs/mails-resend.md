# Encender los mails (Resend)

Los mails de Tu Turno (confirmación al cliente, aviso al negocio, cancelaciones) ya están programados. Mientras no haya clave, no sale ninguno y todo lo demás funciona igual. Para encenderlos hacen falta tres cosas y un redeploy.

## 1. Clave de Resend

En resend.com, API Keys, creá una clave nueva. Si alguna vez pegaste una clave en un chat, no la reutilices: generá otra.

Cargala como `RESEND_API_KEY`:

- En Vercel: Project Settings, Environment Variables, marcala como Sensitive, para Production y Preview.
- En tu máquina: en `.env.local`, solo si querés probar en local.

## 2. Remitente

`MAIL_FROM` tiene que ser una dirección de un dominio verificado en Resend, por ejemplo `Tu Turno <turnos@tudominio.com>`.

Para verificar el dominio: Resend, Domains, Add Domain, y copiá los registros DNS que te pide en el panel de tu registrador.

Sin `MAIL_FROM` se usa el remitente de pruebas de Resend, que **solo entrega a la casilla dueña de tu cuenta de Resend**. Sirve para probar, no para clientes reales.

## 3. Dirección pública

`NEXT_PUBLIC_SITE_URL` con la dirección real de la web (`https://tudominio.com`), para que los links de los mails (cancelar o reprogramar) apunten bien.

## 4. Redeploy y prueba

Después de cargar las variables hay que redeployar en Vercel. Entrá a `/operador` y tocá **Enviarme un mail de prueba**. Si llega, está todo listo.

## Si falla

- «Todavía no hay una clave»: la variable no está cargada en ese entorno, o falta el redeploy.
- «Resend rechazó el envío»: la clave es incorrecta, o `MAIL_FROM` no es de un dominio verificado.
- No llega pero dice que salió: mirá spam.

## Recordatorios del día anterior

Cada día a las 9:00 (hora de Uruguay) Vercel llama a `/api/recordatorios` y se manda un mail a quienes tienen turno al día siguiente y dejaron su mail. Para que funcione:

1. Aplicar la migración `supabase/migrations/20261030000000_recordatorios.sql` en el SQL Editor de Supabase (suma una columna, no cambia nada existente).
2. Cargar `CRON_SECRET` en Vercel (cualquier texto largo y al azar) y redeployar.
3. Tener los mails encendidos (pasos de arriba).

Si falta la migración, la tarea responde «Falta aplicar la migración de recordatorios» y no manda nada. En el plan gratuito de Vercel una tarea programada puede correr una vez por día, que es lo que se usa.

## Aviso de clientes que suelen faltar

Cuando alguien que ya faltó 5 veces o más a turnos de un negocio vuelve a reservar, ese negocio recibe un mail de aviso (a la dirección de mail que tenga cargada el negocio). Solo cuenta lo que ese negocio marcó como «No vino» y lo ve únicamente el dueño.
