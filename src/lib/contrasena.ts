import "server-only";
import { randomInt } from "node:crypto";

// Marca que se guarda en la cuenta de quien entra con una contraseña que le dimos nosotros:
// mientras esté en true, el panel no se abre hasta que elija una propia.
export const MARCA_CAMBIO = "debe_cambiar_password";
export const LARGO_MINIMO = 8;

// Contraseña inicial fácil de dictar por teléfono: el nombre del lugar y cuatro números al azar.
// Es temporal: el sistema obliga a cambiarla en el primer ingreso.
export function contrasenaTemporal(nombre: string): string {
  const base =
    nombre
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 14) || "panel";
  return `${base}${randomInt(1000, 10000)}`;
}
