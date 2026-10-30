"use server";

import { after } from "next/server";
import { fechaLocalDe, instanteLocal, parseRango } from "@/lib/fechas";
import { buildGestionUrl, generarToken, hashToken } from "@/lib/gestion";
import { notificarCanceladoPorNegocio, notificarReservaManual } from "@/lib/notificaciones";
import { crearClienteSesion, obtenerSesion } from "@/lib/supabase/sesion";
import { urlBase } from "@/lib/url";

// Cada acción actúa como la persona logueada: si intenta tocar algo que no es de su negocio,
// las políticas RLS de la base lo rechazan. Acá solo se valida la forma de lo que llega.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const HORA = /^\d{2}:\d{2}$/;

export type ResultadoPanel = { ok: true; mensaje?: string } | { ok: false; mensaje: string };

function uno<T>(valor: T | T[] | null | undefined): T | null {
  return Array.isArray(valor) ? (valor[0] ?? null) : (valor ?? null);
}

async function haySesion(): Promise<boolean> {
  const sesion = await obtenerSesion();
  return Boolean(sesion?.perfil);
}

type FilaReserva = {
  id: string;
  origen: string;
  cliente_email: string | null;
  rango: string;
  servicios: { nombre: string } | { nombre: string }[] | null;
};

type DatosNegocio = { nombre: string; slug: string; timezone: string };

// Los avisos salen después de responder; si fallan, la cancelación igual queda hecha.
async function avisarCancelaciones(filas: FilaReserva[], negocio: DatosNegocio) {
  const base = await urlBase();
  const aAvisar = filas.filter((f) => f.origen === "publico" && f.cliente_email);
  if (aAvisar.length === 0) return;

  after(async () => {
    for (const fila of aAvisar) {
      await notificarCanceladoPorNegocio({
        base,
        negocioSlug: negocio.slug,
        negocioNombre: negocio.nombre,
        timezone: negocio.timezone,
        servicio: uno(fila.servicios)?.nombre ?? "Turno",
        clienteEmail: fila.cliente_email,
        inicio: parseRango(fila.rango).inicio,
      });
    }
  });
}

export async function cancelarDesdePanel(id: string): Promise<ResultadoPanel> {
  if (!UUID.test(id) || !(await haySesion())) {
    return { ok: false, mensaje: "No pudimos cancelar el turno." };
  }

  const supabase = await crearClienteSesion();
  const { data } = await supabase
    .from("reservas")
    .update({ estado: "cancelada" })
    .eq("id", id)
    .eq("estado", "confirmada")
    .neq("origen", "bloqueo")
    .select("id, origen, cliente_email, rango, servicios(nombre), negocios(nombre, slug, timezone)")
    .maybeSingle();

  if (!data) {
    return { ok: false, mensaje: "No se pudo cancelar: el turno ya no está confirmado." };
  }
  const negocio = uno<DatosNegocio>(data.negocios);
  if (negocio) await avisarCancelaciones([data as FilaReserva], negocio);

  return { ok: true, mensaje: "Turno cancelado. El horario quedó libre." };
}

export async function quitarBloqueo(id: string): Promise<ResultadoPanel> {
  if (!UUID.test(id) || !(await haySesion())) {
    return { ok: false, mensaje: "No pudimos quitar el bloqueo." };
  }

  const supabase = await crearClienteSesion();
  const { data } = await supabase
    .from("reservas")
    .update({ estado: "cancelada" })
    .eq("id", id)
    .eq("origen", "bloqueo")
    .eq("estado", "confirmada")
    .select("id")
    .maybeSingle();

  return data
    ? { ok: true, mensaje: "Bloqueo quitado." }
    : { ok: false, mensaje: "No se pudo quitar el bloqueo." };
}

export type EntradaBloqueo = {
  negocioId: string;
  /** "todos" bloquea a todos los profesionales activos del negocio. */
  profesionalId: string;
  fecha: string;
  desde: string;
  hasta: string;
  motivo: string;
  /** Si hay turnos confirmados en ese rango, solo se bloquea si el dueño acepta cancelarlos. */
  cancelarConflictos: boolean;
};

export type ResultadoBloqueo =
  | { ok: true; bloqueados: number; canceladas: number }
  | { ok: false; mensaje: string; conflictos?: number };

export async function bloquearHorario(entrada: EntradaBloqueo): Promise<ResultadoBloqueo> {
  const valido =
    UUID.test(entrada.negocioId) &&
    (entrada.profesionalId === "todos" || UUID.test(entrada.profesionalId)) &&
    FECHA.test(entrada.fecha) &&
    HORA.test(entrada.desde) &&
    HORA.test(entrada.hasta) &&
    typeof entrada.motivo === "string" &&
    entrada.motivo.length <= 200;
  if (!valido) return { ok: false, mensaje: "Revisá los datos del bloqueo." };
  if (!(await haySesion())) return { ok: false, mensaje: "Tu sesión venció. Volvé a entrar." };

  const supabase = await crearClienteSesion();

  const { data: negocio } = await supabase
    .from("negocios")
    .select("nombre, slug, timezone")
    .eq("id", entrada.negocioId)
    .maybeSingle();
  if (!negocio) return { ok: false, mensaje: "No encontramos el negocio." };

  const inicio = instanteLocal(entrada.fecha, entrada.desde, negocio.timezone);
  const fin = instanteLocal(entrada.fecha, entrada.hasta, negocio.timezone);
  if (new Date(fin) <= new Date(inicio)) {
    return { ok: false, mensaje: "La hora de fin tiene que ser después de la de inicio." };
  }

  let consulta = supabase
    .from("profesionales")
    .select("id")
    .eq("negocio_id", entrada.negocioId)
    .eq("activo", true);
  if (entrada.profesionalId !== "todos") consulta = consulta.eq("id", entrada.profesionalId);
  const { data: profesionales } = await consulta;
  const ids: string[] = (profesionales ?? []).map((p: { id: string }) => p.id);
  if (ids.length === 0) return { ok: false, mensaje: "No encontramos al profesional." };

  const rango = `[${inicio},${fin})`;

  // Si ya hay un bloqueo en parte de ese horario, se avisa antes de cancelar cualquier turno.
  const { data: yaBloqueado } = await supabase
    .from("reservas")
    .select("id")
    .in("profesional_id", ids)
    .eq("estado", "confirmada")
    .eq("origen", "bloqueo")
    .overlaps("rango", rango)
    .limit(1);
  if ((yaBloqueado ?? []).length > 0) {
    return {
      ok: false,
      mensaje: "Ya hay un bloqueo en una parte de ese horario. Quitalo primero.",
    };
  }

  // Turnos confirmados que quedarían pisados por el bloqueo.
  const { data: conflictos } = await supabase
    .from("reservas")
    .select("id, origen, cliente_email, rango, servicios(nombre)")
    .in("profesional_id", ids)
    .eq("estado", "confirmada")
    .neq("origen", "bloqueo")
    .overlaps("rango", rango);
  const pisados: FilaReserva[] = conflictos ?? [];

  if (pisados.length > 0 && !entrada.cancelarConflictos) {
    return {
      ok: false,
      conflictos: pisados.length,
      mensaje: `Hay ${pisados.length} ${pisados.length === 1 ? "turno confirmado" : "turnos confirmados"} en ese horario.`,
    };
  }

  if (pisados.length > 0) {
    const { error } = await supabase
      .from("reservas")
      .update({ estado: "cancelada" })
      .in(
        "id",
        pisados.map((p) => p.id),
      );
    if (error) return { ok: false, mensaje: "No pudimos cancelar los turnos que se pisaban." };
    await avisarCancelaciones(pisados, negocio);
  }

  const { error } = await supabase.from("reservas").insert(
    ids.map((profesionalId) => ({
      negocio_id: entrada.negocioId,
      profesional_id: profesionalId,
      cliente_nombre: "Bloqueo",
      notas: entrada.motivo.trim() || null,
      rango,
      estado: "confirmada",
      origen: "bloqueo",
    })),
  );

  if (error) {
    return {
      ok: false,
      mensaje:
        error.code === "23P01"
          ? "Ya hay un bloqueo en una parte de ese horario. Quitalo primero."
          : "No pudimos guardar el bloqueo.",
    };
  }

  return { ok: true, bloqueados: ids.length, canceladas: pisados.length };
}

// ── Vino / no vino ───────────────────────────────────────────────────────────────────────────────

export async function marcarAsistencia(
  id: string,
  estado: "completada" | "no_show" | "confirmada",
): Promise<ResultadoPanel> {
  if (!UUID.test(id) || !["completada", "no_show", "confirmada"].includes(estado)) {
    return { ok: false, mensaje: "No pudimos guardar el cambio." };
  }
  if (!(await haySesion())) return { ok: false, mensaje: "Tu sesión venció. Volvé a entrar." };

  const supabase = await crearClienteSesion();
  const { data: fila } = await supabase
    .from("reservas")
    .select("rango, estado, origen")
    .eq("id", id)
    .maybeSingle();
  if (!fila || fila.origen === "bloqueo" || fila.estado === "cancelada") {
    return { ok: false, mensaje: "Ese turno ya no se puede marcar." };
  }
  // Solo se puede decir si vino cuando el turno ya empezó.
  if (estado !== "confirmada" && new Date(parseRango(fila.rango).inicio) > new Date()) {
    return { ok: false, mensaje: "Ese turno todavía no empezó." };
  }

  const { error } = await supabase.from("reservas").update({ estado }).eq("id", id);
  if (error) {
    return {
      ok: false,
      mensaje:
        error.code === "23P01"
          ? "No se puede deshacer: ese horario ya lo ocupa otro turno."
          : "No pudimos guardar el cambio.",
    };
  }
  return { ok: true };
}

// ── Agendar un turno a mano ──────────────────────────────────────────────────────────────────────

export type TurnoLibre = { profesionalId: string; inicio: string; fin: string };

export async function horariosManual(
  negocioId: string,
  servicioId: string,
  fecha: string,
  profesionalId: string | null,
): Promise<{ ok: true; turnos: TurnoLibre[] } | { ok: false }> {
  if (
    !UUID.test(negocioId) ||
    !UUID.test(servicioId) ||
    !FECHA.test(fecha) ||
    (profesionalId !== null && !UUID.test(profesionalId)) ||
    !(await haySesion())
  ) {
    return { ok: false };
  }
  const { data, error } = await (
    await crearClienteSesion()
  ).rpc("horarios_libres", {
    p_negocio_id: negocioId,
    p_servicio_id: servicioId,
    p_fecha: fecha,
    p_profesional_id: profesionalId ?? undefined,
  });
  if (error) return { ok: false };
  return {
    ok: true,
    turnos: (data ?? []).map((t: { profesional_id: string; inicio: string; fin: string }) => ({
      profesionalId: t.profesional_id,
      inicio: t.inicio,
      fin: t.fin,
    })),
  };
}

export type EntradaManual = {
  negocioId: string;
  servicioId: string;
  profesionalId: string | null;
  inicio: string;
  nombre: string;
  telefono: string;
  email: string;
  notas: string;
};

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Solo el nombre es obligatorio: lo demás lo decide el dueño. La base sigue impidiendo, por sí sola,
// que dos turnos se pisen.
export async function agendarManual(
  e: EntradaManual,
): Promise<{ ok: true; inicio: string } | { ok: false; mensaje: string }> {
  const nombre = typeof e.nombre === "string" ? e.nombre.trim() : "";
  const telefono = typeof e.telefono === "string" ? e.telefono.trim() : "";
  const email = typeof e.email === "string" ? e.email.trim() : "";
  const notas = typeof e.notas === "string" ? e.notas.trim() : "";

  if (nombre.length < 1 || nombre.length > 100) {
    return { ok: false, mensaje: "Escribí el nombre del cliente." };
  }
  if (telefono.length > 30) return { ok: false, mensaje: "Revisá el teléfono." };
  if (email && (email.length > 200 || !EMAIL.test(email))) {
    return { ok: false, mensaje: "Revisá el mail: parece que no es válido." };
  }
  if (notas.length > 300)
    return { ok: false, mensaje: "La nota es muy larga (máximo 300 letras)." };
  if (
    !UUID.test(e.negocioId) ||
    !UUID.test(e.servicioId) ||
    (e.profesionalId !== null && !UUID.test(e.profesionalId)) ||
    Number.isNaN(Date.parse(e.inicio))
  ) {
    return { ok: false, mensaje: "Revisá los datos del turno." };
  }
  if (!(await haySesion())) return { ok: false, mensaje: "Tu sesión venció. Volvé a entrar." };

  const supabase = await crearClienteSesion();
  const [{ data: negocio }, { data: servicio }] = await Promise.all([
    supabase.from("negocios").select("id, timezone").eq("id", e.negocioId).maybeSingle(),
    supabase
      .from("servicios")
      .select("id, duracion_minutos, precio")
      .eq("id", e.servicioId)
      .eq("negocio_id", e.negocioId)
      .eq("activo", true)
      .maybeSingle(),
  ]);
  if (!negocio || !servicio) return { ok: false, mensaje: "No encontramos el servicio." };

  // El horario tiene que seguir libre: se vuelve a consultar al motor de disponibilidad.
  const { data: libres } = await supabase.rpc("horarios_libres", {
    p_negocio_id: e.negocioId,
    p_servicio_id: e.servicioId,
    p_fecha: fechaLocalDe(e.inicio, negocio.timezone),
    p_profesional_id: e.profesionalId ?? undefined,
  });
  const turno = (libres ?? []).find(
    (t: { inicio: string }) => new Date(t.inicio).getTime() === new Date(e.inicio).getTime(),
  ) as { profesional_id: string; inicio: string; fin: string } | undefined;
  if (!turno) {
    return { ok: false, mensaje: "Ese horario ya no está libre. Elegí otro." };
  }

  // Con mail, el cliente recibe la confirmación con su link para cancelar o cambiar el turno.
  const token = email ? generarToken() : null;
  const { error } = await supabase.from("reservas").insert({
    negocio_id: e.negocioId,
    profesional_id: turno.profesional_id,
    servicio_id: e.servicioId,
    cliente_nombre: nombre,
    // La base exige el campo en todo turno de un cliente: vacío significa "no lo dejó".
    cliente_telefono: telefono,
    cliente_email: email || null,
    notas: notas || null,
    estado: "confirmada",
    origen: "manual",
    precio_final: servicio.precio,
    duracion_final_minutos: servicio.duracion_minutos,
    rango: `[${turno.inicio},${turno.fin})`,
    token_gestion_hash: token ? hashToken(token) : null,
  });
  if (error) {
    return {
      ok: false,
      mensaje:
        error.code === "23P01"
          ? "Ese horario se acaba de ocupar. Elegí otro."
          : "No pudimos guardar el turno. Probá de nuevo.",
    };
  }

  if (token) {
    const gestionUrl = buildGestionUrl(token, await urlBase());
    after(() =>
      notificarReservaManual({
        negocioId: e.negocioId,
        servicioId: e.servicioId,
        profesionalId: turno.profesional_id,
        inicio: turno.inicio,
        clienteEmail: email,
        gestionUrl,
      }),
    );
  }
  return { ok: true, inicio: turno.inicio };
}
