// Dirección pública de Tu Turno, para metadata, imágenes de vista previa y sitemap.
// Se cambia con NEXT_PUBLIC_SITE_URL (por ejemplo cuando se conecte tuturno.uy). Si falta, se usa el
// dominio que Vercel le da al deployment (en un preview, el link fijo de la rama), y en local, localhost.
export function urlSitio(): URL {
  const fija = process.env.NEXT_PUBLIC_SITE_URL;
  if (fija) return new URL(fija);
  const vercel =
    process.env.VERCEL_ENV === "production"
      ? process.env.VERCEL_PROJECT_PRODUCTION_URL
      : (process.env.VERCEL_BRANCH_URL ?? process.env.VERCEL_URL);
  if (vercel) return new URL(`https://${vercel}`);
  return new URL("http://localhost:3000");
}

/** Demos públicas que se muestran en la vitrina y se mandan a los leads. */
export const DEMOS = ["barberia-demo", "estetica-demo", "cafe-demo"] as const;
