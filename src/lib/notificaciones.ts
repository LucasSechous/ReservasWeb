import { claveCliente, UMBRAL_AUSENCIAS } from "@/lib/clientes";
import { formatoInstanteLargo } from "@/lib/fechas";
import { enviarMail, mailsActivos } from "@/lib/mail";
import {
  mailAvisoAusencias,
  mailAvisoCancelacion,
  mailAvisoReserva,
  mailCancelacionCliente,
  mailCanceladoPorNegocio,
  mailConfirmacionCliente,
} from "@/lib/mails";
import { createAdminClient } from "@/lib/supabase/admin";
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
  gestionUrl: string;
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
            gestionUrl: d.gestionUrl,
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

// Turno cargado a mano por el negocio: solo se le confirma al cliente (el negocio ya lo sabe).
export async function notificarReservaManual(d: {
  negocioId: string;
  servicioId: string;
  profesionalId: string;
  inicio: string;
  clienteEmail: string;
  gestionUrl: string;
}): Promise<void> {
  if (!mailsActivos()) return;

  try {
    const supabase = createPublicClient();
    const [negocio, servicio, profesional] = await Promise.all([
      supabase
        .from("negocios")
        .select("nombre, timezone, direccion")
        .eq("id", d.negocioId)
        .maybeSingle(),
      supabase.from("servicios").select("nombre").eq("id", d.servicioId).maybeSingle(),
      supabase.from("profesionales").select("nombre").eq("id", d.profesionalId).maybeSingle(),
    ]);
    if (!negocio.data || !servicio.data || !profesional.data) return;

    await enviarMail({
      para: d.clienteEmail,
      ...mailConfirmacionCliente({
        negocio: negocio.data.nombre,
        servicio: servicio.data.nombre,
        profesional: profesional.data.nombre,
        cuando: formatoInstanteLargo(d.inicio, negocio.data.timezone),
        direccion: negocio.data.direccion,
        gestionUrl: d.gestionUrl,
      }),
    });
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

// Si quien acaba de reservar faltó varias veces a turnos de este mismo negocio, se le avisa al dueño.
// Solo se mira el historial de ese negocio y el dato nunca llega al cliente.
export async function avisarSiSueleFaltar(d: {
  negocioId: string;
  clienteNombre: string;
  clienteTelefono: string;
  clienteEmail: string | null;
  inicio: string;
}): Promise<void> {
  if (!mailsActivos()) return;

  try {
    const clave = claveCliente({
      telefono: d.clienteTelefono,
      email: d.clienteEmail,
      nombre: d.clienteNombre,
    });
    // Un nombre solo no alcanza para reconocer a una persona: hace falta un teléfono o un mail.
    if (clave.startsWith("n:")) return;

    const admin = createAdminClient();
    const { data: faltas } = await admin
      .from("reservas")
      .select("cliente_nombre, cliente_telefono, cliente_email")
      .eq("negocio_id", d.negocioId)
      .eq("estado", "no_show")
      .neq("origen", "bloqueo")
      .limit(3000);
    const ausencias = (faltas ?? []).filter(
      (f: { cliente_nombre: string; cliente_telefono: string; cliente_email: string | null }) =>
        claveCliente({
          telefono: f.cliente_telefono,
          email: f.cliente_email,
          nombre: f.cliente_nombre,
        }) === clave,
    ).length;
    if (ausencias < UMBRAL_AUSENCIAS) return;

    const { data: negocio } = await admin
      .from("negocios")
      .select("nombre, email, timezone")
      .eq("id", d.negocioId)
      .maybeSingle();
    if (!negocio?.email) return;

    await enviarMail({
      para: negocio.email,
      ...mailAvisoAusencias({
        negocio: negocio.nombre,
        cliente: d.clienteNombre,
        cuando: formatoInstanteLargo(d.inicio, negocio.timezone),
        ausencias,
      }),
    });
  } catch (error) {
    registrarError(error);
  }
}
