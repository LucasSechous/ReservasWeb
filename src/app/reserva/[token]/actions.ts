"use server";

import { after } from "next/server";
import { avisarOperador } from "@/lib/alertas";
import { MAX_REPROGRAMACIONES, type ReservaGestion, hashToken, tokenValido } from "@/lib/gestion";
import { notificarCancelacion } from "@/lib/notificaciones";
import { createAdminClient } from "@/lib/supabase/admin";
import { urlBase } from "@/lib/url";

// Las acciones de servidor son endpoints públicos: el token se valida siempre, y toda la lógica
// (ventana de cambios, límite, disponibilidad) se vuelve a validar dentro de las funciones SQL gestion_*.
// El token en claro no se guarda ni se loguea: acá solo se usa para calcular su hash.

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

export type ResultadoGestion =
  { ok: true; reserva: ReservaGestion } | { ok: false; codigo: string };

export type Turno = { profesionalId: string; inicio: string; fin: string };

function codigoDe(mensaje: string | undefined): string {
  return mensaje && /^[A-Z_]+$/.test(mensaje) ? mensaje : "ERROR";
}

// Los códigos en mayúsculas son respuestas esperables (FUERA_DE_PLAZO, etc.); cualquier otro error se avisa.
function fallo(donde: string, error: { code?: string; message: string }): { ok: false; codigo: string } {
  const codigo = codigoDe(error.message);
  if (codigo === "ERROR") after(() => avisarOperador(`${donde} (link de gestión)`, error));
  return { ok: false, codigo };
}

export async function cancelarReserva(token: string): Promise<ResultadoGestion> {
  if (!tokenValido(token)) return { ok: false, codigo: "NO_EXISTE" };

  const admin = createAdminClient();
  const hash = hashToken(token);

  // Cancelar dos veces no da error (la función es idempotente), pero el aviso al negocio sale una sola vez.
  const { data: previas } = await admin.rpc("gestion_obtener_reserva", {
    p_token_hash: hash,
    p_max_reprogramaciones: MAX_REPROGRAMACIONES,
  });
  const yaCancelada = (previas as ReservaGestion[] | null)?.[0]?.estado === "cancelada";

  const { data, error } = await admin.rpc("gestion_cancelar_reserva", {
    p_token_hash: hash,
  });
  if (error) return fallo("gestion_cancelar_reserva", error);

  const reserva = (data as ReservaGestion[] | null)?.[0];
  if (!reserva) return { ok: false, codigo: "ERROR" };

  const base = await urlBase();
  if (!yaCancelada) {
    after(() =>
      notificarCancelacion({
        base,
        negocioSlug: reserva.negocio_slug,
        negocioNombre: reserva.negocio_nombre,
        negocioEmail: reserva.negocio_email,
        timezone: reserva.timezone,
        servicio: reserva.servicio_nombre ?? "Turno",
        profesional: reserva.profesional_nombre,
        clienteNombre: reserva.cliente_nombre,
        clienteEmail: reserva.cliente_email,
        inicio: reserva.inicio,
      }),
    );
  }

  return { ok: true, reserva };
}

/** Como mucho un mes por pedido, igual que la reserva nueva. */
const MAX_DIAS = 31;

/**
 * Horarios libres para reprogramar, de varios días de una vez: marcan qué días tienen lugar antes de
 * elegir uno. Un día que falló al consultar queda afuera (no se sabe), en vez de figurar como lleno.
 */
export async function horariosParaReprogramar(
  token: string,
  fechas: string[],
): Promise<{ ok: true; porDia: Record<string, Turno[]> } | { ok: false }> {
  if (
    !tokenValido(token) ||
    !Array.isArray(fechas) ||
    fechas.length === 0 ||
    fechas.length > MAX_DIAS ||
    !fechas.every((f) => typeof f === "string" && FECHA.test(f))
  ) {
    return { ok: false };
  }

  const admin = createAdminClient();
  const { data: filas } = await admin.rpc("gestion_obtener_reserva", {
    p_token_hash: hashToken(token),
    p_max_reprogramaciones: MAX_REPROGRAMACIONES,
  });
  const reserva = (filas as ReservaGestion[] | null)?.[0];
  if (!reserva?.puede_reprogramar || !reserva.servicio_id) return { ok: false };
  const servicioId = reserva.servicio_id;

  // Mismo motor de disponibilidad que la reserva nueva, para el mismo servicio y el mismo profesional.
  const resultados = await Promise.all(
    fechas.map((fecha) =>
      admin.rpc("horarios_libres", {
        p_negocio_id: reserva.negocio_id,
        p_servicio_id: servicioId,
        p_fecha: fecha,
        p_profesional_id: reserva.profesional_id,
      }),
    ),
  );

  const porDia: Record<string, Turno[]> = {};
  resultados.forEach(({ data, error }, i) => {
    if (error) return;
    porDia[fechas[i]] = (data ?? []).map(
      (t: { profesional_id: string; inicio: string; fin: string }) => ({
        profesionalId: t.profesional_id,
        inicio: t.inicio,
        fin: t.fin,
      }),
    );
  });
  return Object.keys(porDia).length > 0 ? { ok: true, porDia } : { ok: false };
}

export async function reprogramarReserva(token: string, inicio: string): Promise<ResultadoGestion> {
  if (!tokenValido(token)) return { ok: false, codigo: "NO_EXISTE" };
  if (typeof inicio !== "string" || Number.isNaN(Date.parse(inicio))) {
    return { ok: false, codigo: "FECHA_INVALIDA" };
  }

  const { data, error } = await createAdminClient().rpc("gestion_reprogramar_reserva", {
    p_token_hash: hashToken(token),
    p_inicio: inicio,
    p_max_reprogramaciones: MAX_REPROGRAMACIONES,
  });
  if (error) return fallo("gestion_reprogramar_reserva", error);

  const reserva = (data as ReservaGestion[] | null)?.[0];
  return reserva ? { ok: true, reserva } : { ok: false, codigo: "ERROR" };
}
