import "server-only";
import { fechaLocalDe, formatoFechaLarga, formatoHora, parseRango } from "@/lib/fechas";
import { uno } from "./contexto";
import type { EstadoTurno, ItemAgenda } from "./reserva-item";

// Lo que se pide de cada reserva para mostrarla en el panel, y cómo se convierte en un item de la agenda.
export const COLUMNAS_TURNO =
  "id, rango, origen, estado, cancelada_por, cliente_nombre, cliente_telefono, cliente_email, notas, servicios(nombre), profesionales(nombre)";

export type FilaTurno = {
  id: string;
  rango: string;
  origen: string;
  estado: string;
  cancelada_por: string | null;
  cliente_nombre: string | null;
  cliente_telefono: string | null;
  cliente_email: string | null;
  notas: string | null;
  servicios: { nombre: string } | { nombre: string }[] | null;
  profesionales: { nombre: string } | { nombre: string }[] | null;
};

export type ItemOrdenado = ItemAgenda & { orden: string; dia: string };

/** Un bloqueo quitado no aporta nada, así que devuelve null. */
export function aItem(
  f: FilaTurno,
  timezone: string,
  ahora: number,
  conFecha = false,
): ItemOrdenado | null {
  const { inicio, fin } = parseRango(f.rango);
  const esBloqueo = f.origen === "bloqueo";
  if (esBloqueo && f.estado === "cancelada") return null;
  const dia = fechaLocalDe(inicio, timezone);

  return {
    id: f.id,
    orden: inicio,
    dia,
    horario: `${formatoHora(inicio, timezone)} – ${formatoHora(fin, timezone)}`,
    esBloqueo,
    servicio: uno(f.servicios)?.nombre ?? "Turno",
    profesional: uno(f.profesionales)?.nombre ?? "",
    cliente: f.cliente_nombre ?? "",
    // Un teléfono vacío significa que el cliente no lo dejó (turnos cargados a mano).
    telefono: f.cliente_telefono?.trim() || null,
    email: f.cliente_email,
    notas: f.notas,
    origen: f.origen,
    estado: f.estado as EstadoTurno,
    canceladaPor: f.cancelada_por,
    empezo: new Date(inicio).getTime() <= ahora,
    fecha: conFecha ? formatoFechaLarga(dia) : undefined,
  };
}

/** Cuántos turnos cuentan de verdad: sin bloqueos ni cancelados. */
export function cuentanComoTurno(i: { esBloqueo: boolean; estado: string }): boolean {
  return !i.esBloqueo && i.estado !== "cancelada";
}
