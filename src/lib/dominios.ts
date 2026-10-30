// Dominios propios de los negocios: «barberiaelfaro.com.uy» muestra la landing de «barberia-el-faro».
// Igual que los temas, viven en el código: para dar de alta uno se agrega una línea acá y se hace el
// paso a paso de docs/dominios-propios.md (agregar el dominio en Vercel y apuntar el DNS).

/** Dominio (sin «www» ni puerto) → slug del negocio. */
export const DOMINIOS: Record<string, string> = {
  // "barberiaelfaro.com.uy": "barberia-el-faro",
};

/** El slug del negocio dueño de ese dominio, o null si es el dominio de ReservasWeb (u otro desconocido). */
export function slugPorDominio(
  host: string | null | undefined,
  mapa: Record<string, string> = DOMINIOS,
): string | null {
  const limpio = (host ?? "")
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, "")
    .replace(/^www\./, "");
  return Object.hasOwn(mapa, limpio) ? mapa[limpio] : null;
}
