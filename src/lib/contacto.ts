// Datos de contacto de ReservasWeb. Se cambian acá y se actualiza toda la página.
export const EMAIL = "sechouslucasuy@gmail.com";
export const WHATSAPP_NUMERO = "59899088224"; // +598 99 088 224, sin signos, para wa.me
export const TELEFONO_MOSTRADO = "+598 99 088 224";

const MENSAJE_WHATSAPP =
  "Hola Lucas, vi tu página de ReservasWeb y quiero una web con reservas para mi negocio.";

export const whatsappUrl = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(MENSAJE_WHATSAPP)}`;

export const mailUrl = `mailto:${EMAIL}?subject=${encodeURIComponent("Quiero una web con reservas")}&body=${encodeURIComponent("Hola Lucas, vi tu página de ReservasWeb. Mi negocio es:\n\n")}`;
