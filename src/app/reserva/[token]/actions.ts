"use server";

import { after } from "next/server";
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
  if (error) return { ok: false, codigo: codigoDe(error.message) };

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

export async function horariosParaReprogramar(
  token: string,
  fecha: string,
): Promise<{ ok: true; turnos: Turno[] } | { ok: false }> {
  if (!tokenValido(token) || !FECHA.test(fecha)) return { ok: false };

  const admin = createAdminClient();
  const { data: filas } = await admin.rpc("gestion_obtener_reserva", {
    p_token_hash: hashToken(token),
    p_max_reprogramaciones: MAX_REPROGRAMACIONES,
  });
  const reserva = (filas as ReservaGestion[] | null)?.[0];
  if (!reserva?.puede_reprogramar || !reserva.servicio_id) return { ok: false };

  // Mismo motor de disponibilidad que la reserva nueva, para el mismo servicio y el mismo profesional.
  const { data, error } = await admin.rpc("horarios_libres", {
    p_negocio_id: reserva.negocio_id,
    p_servicio_id: reserva.servicio_id,
    p_fecha: fecha,
    p_profesional_id: reserva.profesional_id,
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
  if (error) return { ok: false, codigo: codigoDe(error.message) };

  const reserva = (data as ReservaGestion[] | null)?.[0];
  return reserva ? { ok: true, reserva } : { ok: false, codigo: "ERROR" };
}
