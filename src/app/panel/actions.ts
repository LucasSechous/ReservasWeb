"use server";

import { after } from "next/server";
import { instanteLocal, parseRango } from "@/lib/fechas";
import { notificarCanceladoPorNegocio } from "@/lib/notificaciones";
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
      .in("id", pisados.map((p) => p.id));
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
