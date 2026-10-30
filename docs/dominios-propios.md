# Dominio propio para un negocio

Para que `barberiaelfaro.com.uy` muestre la web de «Barbería El Faro» en vez de `tuturno.uy/barberia-el-faro`.

Qué hace el sistema: en ese dominio, la raíz (`/`) muestra la landing del negocio y `/reservar` su página de reservas. Todo lo demás (`/panel`, `/login`, el link para cancelar un turno) sigue funcionando igual.

## Pasos (unos 10 minutos, más lo que tarde el DNS en propagar)

1. **Código.** En `src/lib/dominios.ts` agregá una línea, sin `www` ni `https://`:
   ```ts
   "barberiaelfaro.com.uy": "barberia-el-faro",
   ```
   Hacé el cambio en una rama, mergealo a `develop` y, cuando Lucas lo confirme, a `main` (el dominio solo funciona en producción).
2. **Vercel.** Proyecto → Settings → Domains → agregá `barberiaelfaro.com.uy` y también `www.barberiaelfaro.com.uy` (que redirija al principal). Vercel te muestra qué registros DNS hacen falta.
3. **DNS.** En donde esté registrado el dominio, cargá los registros que pidió Vercel (normalmente un `A` para la raíz y un `CNAME` para `www`). Si el dominio lo compra el cliente, pedile que te dé acceso o que cargue esos dos registros.
4. **Comprobar.** Cuando Vercel muestre el dominio en verde, abrí `https://barberiaelfaro.com.uy` y `https://barberiaelfaro.com.uy/reservar`.

## Qué tener en cuenta

- Los mails (confirmación, recordatorio, link para cancelar) siguen saliendo con la dirección de Tu Turno. Es lo esperable: el link funciona igual.
- Los botones de la landing llevan a `/<slug>/reservar`, que también anda en el dominio propio. La barra de direcciones va a mostrar `/barberia-el-faro/reservar`: no es un error, solo no es tan prolija. Si algún cliente lo pide, se arregla en un paso aparte.
- El dominio lo paga el cliente (en Uruguay, `.com.uy` ronda un monto anual bajo). Conviene ofrecerlo como parte del plan de «tu web en tu propia dirección» y cobrar el trámite.
- Un dominio sin cargar acá no cambia nada: abre la vitrina de Tu Turno.
