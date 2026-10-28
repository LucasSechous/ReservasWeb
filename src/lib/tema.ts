import type { CSSProperties } from "react";

// Identidad visual de cada negocio. Vive en el código, un tema por slug (ver docs/plan-v1.md).
// Para dar de alta un negocio con otra marca, se agrega una entrada a TEMAS.
export type Tema = {
  fondo: string;
  texto: string;
  tarjeta: string;
  acento: string;
  acentoTinta: string;
  /** Segundo color, para los destellos de fondo. */
  brillo: string;
  /** Frase corta que va resaltada con el acento debajo del nombre. */
  lema: string;
  /** Párrafo de presentación debajo del título. */
  intro: string;
  /** Logo del negocio, guardado en public/negocios/<slug>/ (por ejemplo /negocios/mi-slug/logo.svg). */
  logo?: string;
  /** Video corto de fondo para la portada, en bucle y sin sonido (por ejemplo /negocios/mi-slug/fondo.mp4). */
  video?: string;
  /** Foto de portada opcional, guardada en public/negocios/<slug>/ (por ejemplo /negocios/mi-slug/portada.jpg). */
  portada?: string;
  /** Marca la página como demostración: muestra un cartel de "esto es una demo". */
  demo?: boolean;
};

// Misma identidad que la vitrina de ReservasWeb: oscuro, acento lima y destellos violeta.
const TEMA_BASE: Tema = {
  fondo: "#09090b",
  texto: "#f6f5ef",
  tarjeta: "#131316",
  acento: "#c8ff3a",
  acentoTinta: "#0b1200",
  brillo: "#8b5cf6",
  lema: "Reservá tu turno.",
  intro: "Elegí el servicio, el día y el horario. Sin llamadas ni mensajes, a cualquier hora.",
};

const TEMAS: Record<string, Tema> = {
  "barberia-demo": {
    ...TEMA_BASE,
    lema: "Cortes con turno.",
    intro: "Corte, barba y estilo. Elegí tu barbero, tu horario y listo: tu lugar queda reservado.",
    logo: "/negocios/barberia-demo/logo.svg",
    demo: true,
  },
  "estetica-demo": {
    fondo: "#120b10",
    texto: "#fbf3f6",
    tarjeta: "#1d1219",
    acento: "#ff9ec4",
    acentoTinta: "#2b0a18",
    brillo: "#c084fc",
    lema: "Tu momento, con turno.",
    intro: "Faciales, depilación, masajes y más. Reservá tu momento de cuidado en un par de toques.",
    logo: "/negocios/estetica-demo/logo.svg",
    demo: true,
  },
  "peluqueria-demo": {
    fondo: "#07110e",
    texto: "#f3f8f5",
    tarjeta: "#0e1d18",
    acento: "#ff7a59",
    acentoTinta: "#240800",
    brillo: "#2dd4bf",
    lema: "Tu look, a tu hora.",
    intro: "Corte, color y peinados. Elegí con quién y cuándo, y reservá desde el celular.",
    logo: "/negocios/peluqueria-demo/logo.svg",
    demo: true,
  },
};

export function getTema(slug: string): Tema {
  return TEMAS[slug] ?? TEMA_BASE;
}

/**
 * Variables CSS del tema, para poner en el contenedor de la página del negocio.
 * Además de las `--n-*`, pisa los colores de la vitrina (`accent`, `violeta`, `ink-2`) para que
 * los componentes compartidos (títulos, cintas, destellos) tomen la paleta del negocio.
 */
export function temaStyle(tema: Tema): CSSProperties {
  return {
    "--n-fondo": tema.fondo,
    "--n-texto": tema.texto,
    "--n-tarjeta": tema.tarjeta,
    "--n-acento": tema.acento,
    "--n-acento-tinta": tema.acentoTinta,
    "--color-accent": tema.acento,
    "--color-accent-ink": tema.acentoTinta,
    "--color-violeta": tema.brillo,
    "--color-ink-2": tema.tarjeta,
  } as CSSProperties;
}
