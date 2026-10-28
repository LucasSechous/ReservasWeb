"use server";

import { after } from "next/server";
import { verificarCaptcha } from "@/lib/captcha";
import { notificarReserva } from "@/lib/notificaciones";
import { createPublicClient } from "@/lib/supabase/server";
import { urlBase } from "@/lib/url";

// Las acciones de servidor son endpoints públicos: se valida todo lo que llega.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

export type Turno = { profesionalId: string; inicio: string; fin: string };

export async function obtenerHorarios(
  negocioId: string,
  servicioId: string,
  fecha: string,
  profesionalId: string | null,
): Promise<{ ok: true; turnos: Turno[] } | { ok: false }> {
  if (
    !UUID.test(negocioId) ||
    !UUID.test(servicioId) ||
    !FECHA.test(fecha) ||
    (profesionalId !== null && !UUID.test(profesionalId))
  ) {
    return { ok: false };
  }

  const { data, error } = await createPublicClient().rpc("horarios_libres", {
    p_negocio_id: negocioId,
    p_servicio_id: servicioId,
    p_fecha: fecha,
    p_profesional_id: profesionalId ?? undefined,
  });
  if (error) return { ok: false };

  return {
    ok: true,
    turnos: (data ?? []).map(
      (t: { profesional_id: string; inicio: string; fin: string }) => ({
        profesionalId: t.profesional_id,
        inicio: t.inicio,
        fin: t.fin,
      }),
    ),
  };
}

export type DatosReserva = {
  negocioId: string;
  servicioId: string;
  /** null = que el sistema asigne al primer profesional libre. */
  profesionalId: string | null;
  inicio: string;
  nombre: string;
  telefono: string;
  email: string;
  captcha: string | null;
};

export type ResultadoReserva =
  | {
      ok: true;
      token: string;
      profesionalId: string;
      inicio: string;
      fin: string;
    }
  | { ok: false; codigo: string };

export async function crearReserva(datos: DatosReserva): Promise<ResultadoReserva> {
  const valido =
    UUID.test(datos.negocioId) &&
    UUID.test(datos.servicioId) &&
    (datos.profesionalId === null || UUID.test(datos.profesionalId)) &&
    !Number.isNaN(Date.parse(datos.inicio)) &&
    typeof datos.nombre === "string" &&
    datos.nombre.length <= 100 &&
    typeof datos.telefono === "string" &&
    datos.telefono.length <= 30 &&
    typeof datos.email === "string" &&
    datos.email.length <= 200;
  if (!valido) return { ok: false, codigo: "DATOS_INVALIDOS" };

  if (!(await verificarCaptcha(datos.captcha))) {
    return { ok: false, codigo: "CAPTCHA" };
  }

  const { data, error } = await createPublicClient().rpc("reservar", {
    p_negocio_id: datos.negocioId,
    p_servicio_id: datos.servicioId,
    // Sin valor por defecto en la base: si no se eligió profesional va null, nunca se omite.
    p_profesional_id: datos.profesionalId,
    p_inicio: datos.inicio,
    p_cliente_nombre: datos.nombre,
    p_cliente_telefono: datos.telefono,
    p_cliente_email: datos.email || undefined,
  });

  if (error) {
    // Los errores de reservar() llegan como mensaje en mayúsculas (HORARIO_NO_DISPONIBLE, etc.).
    return {
      ok: false,
      codigo: /^[A-Z_]+$/.test(error.message) ? error.message : "ERROR",
    };
  }

  const fila = Array.isArray(data) ? data[0] : data;
  if (!fila) return { ok: false, codigo: "ERROR" };

  // Los mails salen después de responderle al cliente; si fallan, la reserva igual queda hecha.
  const base = await urlBase();
  after(() =>
    notificarReserva({
      negocioId: datos.negocioId,
      servicioId: datos.servicioId,
      profesionalId: fila.profesional_id,
      inicio: fila.inicio,
      clienteNombre: datos.nombre.trim(),
      clienteTelefono: datos.telefono.trim(),
      clienteEmail: datos.email.trim() || null,
      token: fila.token_cancelacion,
      base,
    }),
  );

  return {
    ok: true,
    token: fila.token_cancelacion,
    profesionalId: fila.profesional_id,
    inicio: fila.inicio,
    fin: fila.fin,
  };
}
