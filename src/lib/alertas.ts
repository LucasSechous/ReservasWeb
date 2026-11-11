import { EMAIL } from "@/lib/contacto";
import { enviarMail } from "@/lib/mail";

// Aviso por mail al operador cuando algo que no debería fallar falla (por ejemplo, la reserva pública).
// Así uno se entera antes de que un cliente se queje. Sin datos personales: solo dónde y qué error.
// Para no llenar la casilla si algo queda roto, cada lugar avisa como mucho una vez cada 15 minutos
// (por instancia del servidor: alguna vez puede llegar repetido).
const ESPERA_MS = 15 * 60_000;
const ultimoAviso = new Map<string, number>();

export async function avisarOperador(donde: string, error: { code?: string; message?: string } | string) {
  const detalle = typeof error === "string" ? error : `${error.code ?? "sin código"}: ${error.message ?? ""}`;
  console.error(`[alerta] ${donde}: ${detalle}`);

  const ahora = Date.now();
  if (ahora - (ultimoAviso.get(donde) ?? 0) < ESPERA_MS) return;
  ultimoAviso.set(donde, ahora);

  const entorno = process.env.VERCEL_ENV ?? "local";
  const texto = `Falló ${donde} (${entorno}).\n\n${detalle}\n\nRevisá los logs de Vercel y de Supabase. No se vuelve a avisar por esto durante 15 minutos.`;
  await enviarMail({
    para: process.env.ALERTAS_EMAIL ?? EMAIL,
    asunto: `Tu Turno: falló ${donde}`,
    texto,
    html: `<pre style="font-family:monospace;font-size:14px;white-space:pre-wrap;">${texto
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")}</pre>`,
  });
}
