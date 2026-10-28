"use server";

import { after } from "next/server";
import { notificarCancelacion } from "@/lib/notificaciones";
import { createPublicClient } from "@/lib/supabase/server";
import { urlBase } from "@/lib/url";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ResultadoCancelacion =
  | { ok: true }
  | { ok: false; codigo: "NO_EXISTE" | "YA_CANCELADA" | "YA_PASO" | "ERROR" };

export async function cancelarTurno(token: string): Promise<ResultadoCancelacion> {
  if (typeof token !== "string" || !UUID.test(token)) {
    return { ok: false, codigo: "NO_EXISTE" };
  }

  const supabase = createPublicClient();

  // Se lee antes de cancelar para tener los datos del aviso al negocio.
  const { data } = await supabase.rpc("reserva_por_token", { p_token: token });
  const reserva = data?.[0];
  if (!reserva) return { ok: false, codigo: "NO_EXISTE" };
  if (!reserva.puede_cancelar) {
    return { ok: false, codigo: reserva.estado === "cancelada" ? "YA_CANCELADA" : "YA_PASO" };
  }

  const { data: cancelada, error } = await supabase.rpc("cancelar_reserva", { p_token: token });
  if (error || !cancelada) return { ok: false, codigo: "ERROR" };

  const base = await urlBase();
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

  return { ok: true };
}
