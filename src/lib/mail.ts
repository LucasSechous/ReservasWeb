// Envío de mails con Resend, por su API HTTP (sin dependencias extra).
// Sin RESEND_API_KEY no se manda nada y la app sigue funcionando: los mails se encienden
// cuando se cargan las claves. MAIL_FROM debe ser un remitente de un dominio verificado en Resend.
export function mailsActivos(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function enviarMail(mail: {
  para: string;
  asunto: string;
  html: string;
  texto: string;
}): Promise<boolean> {
  const clave = process.env.RESEND_API_KEY;
  if (!clave) return false;

  const remitente = process.env.MAIL_FROM ?? "Tu Turno <onboarding@resend.dev>";

  try {
    const respuesta = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${clave}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: remitente,
        to: [mail.para],
        subject: mail.asunto,
        html: mail.html,
        text: mail.texto,
      }),
    });
    if (!respuesta.ok) {
      // No se loguea el destinatario ni el contenido: son datos personales.
      console.error(`[mail] Resend respondió ${respuesta.status}`);
    }
    return respuesta.ok;
  } catch (error) {
    console.error("[mail] no se pudo enviar:", error instanceof Error ? error.message : error);
    return false;
  }
}
