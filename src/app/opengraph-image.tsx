import { ImageResponse } from "next/og";
import { TRAZO_CALENDARIO } from "@/components/logo";
import { TEXTO as LETRA_TEXTO, cargarFuente } from "@/lib/og";

// Vista previa de la vitrina al compartir el link. Mismos colores que la página (globals.css).
export const alt = "Tu Turno: webs con reservas online para tu negocio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const FONDO = "#0c1626";
const TEXTO = "#eef3fb";
const ACENTO = "#3ddc97";
const VIOLETA = "#4678e6";

const MARCA = "tuturno";
const LINEA_1 = "Tu negocio, tu web,";
const LINEA_2 = "turnos que se reservan solos.";
const BAJADA = "Webs con reservas online para barberías, estética, clínicas y más · Uruguay";

export default async function Image() {
  const [deTitulo, deTexto] = await Promise.all([
    cargarFuente("Bricolage Grotesque", 800, MARCA + LINEA_1 + LINEA_2),
    cargarFuente(LETRA_TEXTO, 400, BAJADA),
  ]);
  const titulo = deTitulo.length > 0 ? "Bricolage Grotesque" : undefined;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          backgroundColor: FONDO,
          backgroundImage: `radial-gradient(circle at 88% 8%, ${VIOLETA}66 0%, transparent 45%), radial-gradient(circle at 45% 115%, ${ACENTO}40 0%, transparent 50%)`,
          color: TEXTO,
          fontFamily: deTexto.length > 0 ? LETRA_TEXTO : undefined,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontFamily: titulo, fontSize: 44, fontWeight: 800 }}>
          <svg
            width="58"
            height="58"
            viewBox="0 0 24 24"
            fill="none"
            stroke={ACENTO}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3.5" y="4.5" width="17" height="16.5" rx="3.5" />
            {TRAZO_CALENDARIO.map((d) => (
              <path key={d} d={d} />
            ))}
          </svg>
          <span style={{ display: "flex" }}>
            tu<span style={{ color: ACENTO }}>turno</span>
          </span>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontFamily: titulo,
            fontSize: 78,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: -2,
          }}
        >
          <span>{LINEA_1}</span>
          <span style={{ color: ACENTO }}>{LINEA_2}</span>
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "rgba(238,243,251,0.75)" }}>
          {BAJADA}
        </div>
      </div>
    ),
    { ...size, fonts: [...deTitulo, ...deTexto] },
  );
}
