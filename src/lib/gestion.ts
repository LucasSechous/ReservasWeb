import "server-only";
import { createHash, randomBytes } from "node:crypto";

// Gestión de la reserva por link (cancelar / reprogramar). El token en claro solo existe para armar el
// link: en la base queda su sha256 y nunca se guarda ni se loguea.

/** Cuántas veces puede reprogramar el cliente una misma reserva. Único lugar donde se define. */
export const MAX_REPROGRAMACIONES = 2;

// 32 bytes en base64url = 43 caracteres.
const TOKEN = /^[A-Za-z0-9_-]{43}$/;

export function generarToken(): string {
  return randomBytes(32).toString("base64url");
}

export function tokenValido(token: unknown): token is string {
  return typeof token === "string" && TOKEN.test(token);
}

/** sha256 en hexadecimal: lo que se guarda en reservas.token_gestion_hash. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** El link que recibe el cliente. `base` es la dirección pública de la web (ver urlBase()). */
export function buildGestionUrl(token: string, base: string): string {
  return `${base.replace(/\/$/, "")}/reserva/${token}`;
}

export type ReservaGestion = {
  reserva_id: string;
  negocio_id: string;
  negocio_slug: string;
  negocio_nombre: string;
  negocio_telefono: string | null;
  negocio_email: string | null;
  negocio_direccion: string | null;
  timezone: string;
  servicio_id: string | null;
  servicio_nombre: string | null;
  profesional_id: string;
  profesional_nombre: string;
  cliente_nombre: string;
  cliente_email: string | null;
  inicio: string;
  fin: string;
  estado: string;
  precio_final: number | null;
  reprogramaciones: number;
  horas_min_cambio: number;
  puede_cancelar: boolean;
  puede_reprogramar: boolean;
  motivo: "CANCELADA" | "YA_PASO" | "FUERA_DE_VENTANA" | "LIMITE_REPROGRAMACIONES" | null;
};
