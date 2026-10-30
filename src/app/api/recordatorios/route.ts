import { NextResponse, type NextRequest } from "next/server";
import { formatoInstanteLargo, fechaLocalDe, hoyEn, parseRango, sumarDias } from "@/lib/fechas";
import { enviarMail, mailsActivos } from "@/lib/mail";
import { mailRecordatorio } from "@/lib/mails";
import { createAdminClient } from "@/lib/supabase/admin";

// Recordatorios del día anterior. Lo llama la tarea programada de Vercel (vercel.json) una vez por
// día; Vercel manda la clave CRON_SECRET en el encabezado Authorization. Sin esa clave no responde.
type Fila = {
  id: string;
  rango: string;
  cliente_email: string;
  negocios:
    | { nombre: string; telefono: string | null; direccion: string | null; timezone: string }
    | { nombre: string; telefono: string | null; direccion: string | null; timezone: string }[]
    | null;
  servicios: { nombre: string } | { nombre: string }[] | null;
  profesionales: { nombre: string } | { nombre: string }[] | null;
};

function uno<T>(valor: T | T[] | null | undefined): T | null {
  return Array.isArray(valor) ? (valor[0] ?? null) : (valor ?? null);
}

export async function GET(request: NextRequest) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto || request.headers.get("authorization") !== `Bearer ${secreto}`) {
    return new NextResponse("No autorizado", { status: 401 });
  }
  if (!mailsActivos()) {
    return NextResponse.json({
      enviados: 0,
      motivo: "Los mails están apagados (falta RESEND_API_KEY).",
    });
  }

  const admin = createAdminClient();
  const ahora = new Date();
  const hasta = new Date(ahora.getTime() + 48 * 3600_000);

  const { data, error } = await admin
    .from("reservas")
    .select(
      "id, rango, cliente_email, negocios(nombre, telefono, direccion, timezone), servicios(nombre), profesionales(nombre)",
    )
    .eq("estado", "confirmada")
    .neq("origen", "bloqueo")
    .not("cliente_email", "is", null)
    .is("recordatorio_enviado_at", null)
    .overlaps("rango", `[${ahora.toISOString()},${hasta.toISOString()})`)
    .limit(500);

  if (error) {
    // Antes de aplicar la migración de recordatorios, la columna no existe.
    const falta = /recordatorio_enviado_at/.test(error.message);
    return NextResponse.json(
      {
        enviados: 0,
        motivo: falta ? "Falta aplicar la migración de recordatorios." : "Error al consultar.",
      },
      { status: falta ? 503 : 500 },
    );
  }

  let enviados = 0;
  for (const f of (data ?? []) as Fila[]) {
    const negocio = uno(f.negocios);
    const servicio = uno(f.servicios);
    const profesional = uno(f.profesionales);
    if (!negocio || !servicio || !profesional) continue;

    // Solo los turnos de mañana, según el día del negocio.
    const { inicio } = parseRango(f.rango);
    if (fechaLocalDe(inicio, negocio.timezone) !== sumarDias(hoyEn(negocio.timezone), 1)) continue;

    const salio = await enviarMail({
      para: f.cliente_email,
      ...mailRecordatorio({
        negocio: negocio.nombre,
        servicio: servicio.nombre,
        profesional: profesional.nombre,
        cuando: formatoInstanteLargo(inicio, negocio.timezone),
        direccion: negocio.direccion,
        telefono: negocio.telefono,
      }),
    });
    // Solo se marca si el mail salió: si falló, mañana se reintenta.
    if (salio) {
      await admin
        .from("reservas")
        .update({ recordatorio_enviado_at: new Date().toISOString() })
        .eq("id", f.id);
      enviados++;
    }
  }

  return NextResponse.json({ enviados });
}
