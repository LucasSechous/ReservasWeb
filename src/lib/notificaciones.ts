import { formatoInstanteLargo } from "@/lib/fechas";
import { enviarMail, mailsActivos } from "@/lib/mail";
import {
  mailAvisoCancelacion,
  mailAvisoReserva,
  mailCancelacionCliente,
  mailCanceladoPorNegocio,
  mailConfirmacionCliente,
} from "@/lib/mails";
import { createPublicClient } from "@/lib/supabase/server";

// Ninguna notificación puede romper una reserva o una cancelación: todo se atrapa y se loguea sin datos personales.
function registrarError(error: unknown) {
  console.error("[notificaciones]", error instanceof Error ? error.message : error);
}

export async function notificarReserva(d: {
  negocioId: string;
  servicioId: string;
  profesionalId: string;
  inicio: string;
  clienteNombre: string;
  clienteTelefono: string;
  clienteEmail: string | null;
  token: string;
  base: string;
}): Promise<void> {
  if (!mailsActivos()) return;

  try {
    const supabase = createPublicClient();
    const [negocio, servicio, profesional] = await Promise.all([
      supabase
        .from("negocios")
        .select("nombre, email, timezone, direccion")
        .eq("id", d.negocioId)
        .maybeSingle(),
      supabase.from("servicios").select("nombre").eq("id", d.servicioId).maybeSingle(),
      supabase.from("profesionales").select("nombre").eq("id", d.profesionalId).maybeSingle(),
    ]);
    if (!negocio.data || !servicio.data || !profesional.data) return;

    const cuando = formatoInstanteLargo(d.inicio, negocio.data.timezone);
    const tareas: Promise<boolean>[] = [];

    if (d.clienteEmail) {
      tareas.push(
        enviarMail({
          para: d.clienteEmail,
          ...mailConfirmacionCliente({
            negocio: negocio.data.nombre,
            servicio: servicio.data.nombre,
            profesional: profesional.data.nombre,
            cuando,
            direccion: negocio.data.direccion,
            cancelarUrl: `${d.base}/cancelar/${d.token}`,
          }),
        }),
      );
    }
    if (negocio.data.email) {
      tareas.push(
        enviarMail({
          para: negocio.data.email,
          ...mailAvisoReserva({
            negocio: negocio.data.nombre,
            servicio: servicio.data.nombre,
            profesional: profesional.data.nombre,
            cuando,
            cliente: d.clienteNombre,
            telefono: d.clienteTelefono,
            email: d.clienteEmail,
          }),
        }),
      );
    }
    await Promise.allSettled(tareas);
  } catch (error) {
    registrarError(error);
  }
}

export async function notificarCancelacion(d: {
  base: string;
  negocioSlug: string;
  negocioNombre: string;
  negocioEmail: string | null;
  timezone: string;
  servicio: string;
  profesional: string;
  clienteNombre: string;
  clienteEmail: string | null;
  inicio: string;
}): Promise<void> {
  if (!mailsActivos()) return;

  try {
    const cuando = formatoInstanteLargo(d.inicio, d.timezone);
    const tareas: Promise<boolean>[] = [];

    if (d.negocioEmail) {
      tareas.push(
        enviarMail({
          para: d.negocioEmail,
          ...mailAvisoCancelacion({
            negocio: d.negocioNombre,
            servicio: d.servicio,
            profesional: d.profesional,
            cuando,
            cliente: d.clienteNombre,
          }),
        }),
      );
    }
    if (d.clienteEmail) {
      tareas.push(
        enviarMail({
          para: d.clienteEmail,
          ...mailCancelacionCliente({
            negocio: d.negocioNombre,
            servicio: d.servicio,
            cuando,
            reservarUrl: `${d.base}/${d.negocioSlug}/reservar`,
          }),
        }),
      );
    }
    await Promise.allSettled(tareas);
  } catch (error) {
    registrarError(error);
  }
}

/** Avisa al cliente que el negocio canceló su turno (por ejemplo, al bloquear un horario). */
export async function notificarCanceladoPorNegocio(d: {
  base: string;
  negocioSlug: string;
  negocioNombre: string;
  timezone: string;
  servicio: string;
  clienteEmail: string | null;
  inicio: string;
}): Promise<void> {
  if (!mailsActivos() || !d.clienteEmail) return;

  try {
    await enviarMail({
      para: d.clienteEmail,
      ...mailCanceladoPorNegocio({
        negocio: d.negocioNombre,
        servicio: d.servicio,
        cuando: formatoInstanteLargo(d.inicio, d.timezone),
        reservarUrl: `${d.base}/${d.negocioSlug}/reservar`,
      }),
    });
  } catch (error) {
    registrarError(error);
  }
}
