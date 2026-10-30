import type { CSSProperties } from "react";
import { vocabularioDe, type Rubro, type Vocabulario } from "@/lib/vocabulario";

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
  /** false = landing simple, sin reservas: no hay botón de reservar ni flujo de turnos. Por defecto, con reservas. */
  reservas?: boolean;
  /** Texto de la etiqueta sobre el título. Por defecto «Reservas online». */
  etiqueta?: string;
  /** Título y bajada de la sección de servicios (en una landing simple, por ejemplo «La carta»). */
  tituloServicios?: string;
  subtituloServicios?: string;
  /** Logo del negocio, guardado en public/negocios/<slug>/ (por ejemplo /negocios/mi-slug/logo.svg). */
  logo?: string;
  /** Video corto de fondo para la portada, en bucle y sin sonido (por ejemplo /negocios/mi-slug/fondo.mp4). */
  video?: string;
  /** Foto de portada opcional, guardada en public/negocios/<slug>/ (por ejemplo /negocios/mi-slug/portada.jpg). */
  portada?: string;
  /** Foto de fondo para la sección del equipo (se muestra oscurecida). */
  fondoEquipo?: string;
  /** Qué parte de la foto de fondo del equipo queda a la vista (CSS object-position). Por defecto, el centro. */
  fondoEquipoPosicion?: string;
  /** Fotos de la galería, guardadas en public/negocios/<slug>/. Con `alt` describiendo cada una. */
  galeria?: { src: string; alt: string }[];
  /**
   * Estilo de la landing. Sin valor: la landing oscura con destellos (app/[slug]/page.tsx).
   * "retro": papel crema y letras de cartel (components/landing-retro.tsx).
   * "editorial": fondo claro, serif fina y mucho aire (components/landing-editorial.tsx).
   */
  estilo?: "retro" | "editorial";
  /** Tercer color de la paleta (el estilo retro lo usa para franjas y fondos de sección). Por defecto, el brillo. */
  detalle?: string;
  /** Marca la página como demostración: muestra un cartel de "esto es una demo". */
  demo?: boolean;
  /** Rubro del negocio: define las palabras (especialista, consulta, clase…). Sin valor, las genéricas. */
  rubro?: Rubro;
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
    fondo: "#0e0808",
    texto: "#fbf1ee",
    tarjeta: "#1b0f0f",
    acento: "#ff4d4d",
    acentoTinta: "#2a0505",
    brillo: "#b91c1c",
    lema: "Cortes con turno.",
    intro: "Corte, barba y estilo. Elegí tu barbero, tu horario y listo: tu lugar queda reservado.",
    logo: "/negocios/barberia-demo/logo.svg",
    portada: "/negocios/barberia-demo/corte.jpg",
    fondoEquipo: "/negocios/barberia-demo/barberia2.jpg",
    galeria: [
      { src: "/negocios/barberia-demo/tijeras.jpg", alt: "Tijeras y navaja sobre una mesa de madera" },
      { src: "/negocios/barberia-demo/barberia.jpg", alt: "Interior de la barbería, con espejos y sillones" },
      { src: "/negocios/barberia-demo/corte.jpg", alt: "Un barbero cortando el pelo con peine y tijera" },
    ],
    demo: true,
  },
  "estetica-demo": {
    estilo: "editorial",
    fondo: "#f6f1ea",
    texto: "#2b2420",
    tarjeta: "#fffdf9",
    acento: "#a4506a",
    acentoTinta: "#fffaf6",
    brillo: "#ead3d6",
    detalle: "#8b7a6b",
    lema: "Tu momento, con turno.",
    intro: "Faciales, depilación, masajes y más. Reservá tu momento de cuidado en un par de toques.",
    logo: "/negocios/estetica-demo/logo.svg",
    portada: "/negocios/estetica-demo/portada.jpg",
    fondoEquipo: "/negocios/estetica-demo/equipo.jpg",
    fondoEquipoPosicion: "center 72%",
    galeria: [
      { src: "/negocios/estetica-demo/galeria-1.jpg", alt: "Pétalos rosados flotando en un cuenco de agua" },
      { src: "/negocios/estetica-demo/galeria-2.jpg", alt: "Tratamiento facial con guantes rosados" },
      { src: "/negocios/estetica-demo/galeria-3.jpg", alt: "Bandeja de spa con flores, sales y una vela" },
    ],
    demo: true,
  },
  "clinica-demo": {
    estilo: "editorial",
    rubro: "salud",
    fondo: "#f2f7f6",
    texto: "#12302e",
    tarjeta: "#ffffff",
    acento: "#0f766e",
    acentoTinta: "#f2fbfa",
    brillo: "#cfe9e5",
    detalle: "#5b7f7b",
    lema: "Tu salud, con turno.",
    intro:
      "Consultas con especialistas, sin llamadas ni esperas. Elegí la consulta, tu especialista y el horario que te quede bien.",
    etiqueta: "Clínica de especialidades",
    tituloServicios: "Consultas",
    subtituloServicios: "Elegí la consulta que necesitás.",
    logo: "/negocios/clinica-demo/logo.svg",
    demo: true,
  },
  "cafe-demo": {
    estilo: "retro",
    fondo: "#f1e3c0",
    texto: "#3a2213",
    tarjeta: "#fff6de",
    acento: "#c4412a",
    acentoTinta: "#fff4da",
    brillo: "#e8a73a",
    detalle: "#2f6e61",
    lema: "De barrio, con cariño.",
    intro: "Café de especialidad, tostadas y algo dulce para acompañar. Pasá, te esperamos todos los días.",
    etiqueta: "Café de especialidad",
    tituloServicios: "La carta",
    subtituloServicios: "Lo que preparamos todos los días.",
    reservas: false,
    logo: "/negocios/cafe-demo/logo.svg",
    portada: "/negocios/cafe-demo/portada.jpg",
    galeria: [
      { src: "/negocios/cafe-demo/galeria-1.jpg", alt: "Manos sirviendo leche para hacer latte art" },
      { src: "/negocios/cafe-demo/galeria-2.jpg", alt: "Mesa de brunch con tostadas, jugos y frutos rojos" },
      { src: "/negocios/cafe-demo/galeria-3.jpg", alt: "Tostada de masa madre con palta y huevos pochados" },
    ],
    demo: true,
  },
};

/** true si el color de fondo (#rrggbb) es claro. Define si los avisos usan rojo oscuro o claro. */
function esClaro(hex: string): boolean {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  const luminancia = 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
  return luminancia > 140;
}

export function getTema(slug: string): Tema {
  return TEMAS[slug] ?? TEMA_BASE;
}

/** Las palabras del rubro del negocio (genéricas si el tema no define rubro). */
export function getVocabulario(slug: string): Vocabulario {
  return vocabularioDe(getTema(slug).rubro);
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
    "--n-detalle": tema.detalle ?? tema.brillo,
    "--n-error": esClaro(tema.fondo) ? "#b42318" : "#fecaca",
    "--color-accent": tema.acento,
    "--color-accent-ink": tema.acentoTinta,
    "--color-violeta": tema.brillo,
    "--color-ink-2": tema.tarjeta,
  } as CSSProperties;
}
