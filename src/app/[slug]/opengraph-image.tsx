import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getNegocio } from "@/lib/negocios";
import { TEXTO, cargarFuente } from "@/lib/og";
import { type Tema, getTema } from "@/lib/tema";

// Vista previa de la landing de cada negocio al compartir el link: nombre, lema, logo y colores del tema,
// con la misma letra de títulos que su landing.
export const alt = "Vista previa de la página del negocio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const LETRA: Record<NonNullable<Tema["estilo"]> | "base", { familia: string; peso: 400 | 500 | 800 }> = {
  base: { familia: "Bricolage Grotesque", peso: 800 },
  editorial: { familia: "Cormorant Garamond", peso: 500 },
  retro: { familia: "Shrikhand", peso: 400 },
  clasica: { familia: "Playfair Display", peso: 800 },
};

// El logo vive en public/ (next.config.ts lo suma al paquete de esta ruta). Si falta, la imagen sale sin logo.
async function logoComoDataUrl(ruta: string | undefined): Promise<string | null> {
  if (!ruta) return null;
  try {
    const svg = await readFile(join(process.cwd(), "public", ruta));
    return `data:image/svg+xml;base64,${svg.toString("base64")}`;
  } catch {
    return null;
  }
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const negocio = await getNegocio(slug);
  const tema = getTema(slug);
  const nombre = negocio?.nombre ?? "Tu Turno";
  const conReservas = tema.reservas !== false;
  const pie = conReservas ? "Reservá tu turno online" : "Carta, horarios y WhatsApp";
  const etiqueta = tema.etiqueta ?? "Reservas online";
  const firma = "Demo de Tu Turno";

  const letra = LETRA[tema.estilo ?? "base"];
  const [deTitulo, deTexto, logo] = await Promise.all([
    cargarFuente(letra.familia, letra.peso, nombre + tema.lema),
    cargarFuente(TEXTO, 400, etiqueta.toUpperCase() + pie + firma),
    logoComoDataUrl(negocio ? tema.logo : undefined),
  ]);
  const titulo = deTitulo.length > 0 ? letra.familia : undefined;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 64,
          padding: "72px 80px",
          backgroundColor: tema.fondo,
          backgroundImage: `radial-gradient(circle at 90% 10%, ${tema.brillo}73 0%, transparent 45%), radial-gradient(circle at 10% 110%, ${tema.acento}33 0%, transparent 45%)`,
          color: tema.texto,
          fontFamily: deTexto.length > 0 ? TEXTO : undefined,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", flex: 1, height: "100%", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontSize: 26, letterSpacing: 4, textTransform: "uppercase", opacity: 0.7 }}>
            {etiqueta}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontFamily: titulo, fontSize: 104, fontWeight: letra.peso, lineHeight: 1 }}>
              {nombre}
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 20,
                fontFamily: titulo,
                fontSize: 60,
                fontWeight: letra.peso,
                lineHeight: 1.1,
                color: tema.acento,
              }}
            >
              {tema.lema}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div
              style={{
                display: "flex",
                padding: "14px 30px",
                borderRadius: tema.estilo ? 6 : 999,
                backgroundColor: tema.acento,
                color: tema.acentoTinta,
                fontSize: 30,
                whiteSpace: "nowrap",
              }}
            >
              {pie}
            </div>
            {tema.demo && (
              <div style={{ display: "flex", fontSize: 26, opacity: 0.6, whiteSpace: "nowrap" }}>{firma}</div>
            )}
          </div>
        </div>
        {logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" width={300} height={300} />
        )}
      </div>
    ),
    { ...size, fonts: [...deTitulo, ...deTexto] },
  );
}
