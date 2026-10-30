// Cómo se reconoce a un mismo cliente dentro de un negocio. El teléfono y el mail son opcionales,
// así que se usa el que haya: primero el teléfono, después el mail y, si no hay ninguno, el nombre.

/** Cuántas veces que no se presentó hace que se le avise al dueño al volver a reservar. */
export const UMBRAL_AUSENCIAS = 5;

/** Solo los dígitos, sin el 598 de Uruguay ni el 0 inicial: "099 123 456" y "+598 99 123 456" coinciden. */
export function digitosTelefono(telefono: string | null | undefined): string {
  const d = (telefono ?? "").replace(/\D/g, "");
  const sin598 = d.startsWith("598") && d.length > 9 ? d.slice(3) : d;
  return sin598.replace(/^0/, "");
}

export function claveCliente(c: {
  telefono?: string | null;
  email?: string | null;
  nombre?: string | null;
}): string {
  const tel = digitosTelefono(c.telefono);
  if (tel.length >= 7) return `t:${tel}`;
  const mail = (c.email ?? "").trim().toLowerCase();
  if (mail) return `e:${mail}`;
  return `n:${(c.nombre ?? "").trim().toLowerCase().replace(/\s+/g, " ")}`;
}
