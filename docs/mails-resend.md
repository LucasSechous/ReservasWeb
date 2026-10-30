# Encender los mails (Resend)

Los mails de ReservasWeb (confirmación al cliente, aviso al negocio, cancelaciones) ya están programados. Mientras no haya clave, no sale ninguno y todo lo demás funciona igual. Para encenderlos hacen falta tres cosas y un redeploy.

## 1. Clave de Resend

En resend.com, API Keys, creá una clave nueva. Si alguna vez pegaste una clave en un chat, no la reutilices: generá otra.

Cargala como `RESEND_API_KEY`:

- En Vercel: Project Settings, Environment Variables, marcala como Sensitive, para Production y Preview.
- En tu máquina: en `.env.local`, solo si querés probar en local.

## 2. Remitente

`MAIL_FROM` tiene que ser una dirección de un dominio verificado en Resend, por ejemplo `ReservasWeb <reservas@tudominio.com>`.

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
