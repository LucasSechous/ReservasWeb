import type { CSSProperties } from "react";

// Identidad visual de cada negocio. Vive en el código, un tema por slug (ver docs/plan-v1.md).
// Para dar de alta un negocio con otra marca, se agrega una entrada a TEMAS.
export type Tema = {
  fondo: string;
  texto: string;
  tarjeta: string;
  acento: string;
  acentoTinta: string;
};

const TEMA_BASE: Tema = {
  fondo: "#0f0f10",
  texto: "#f4f1ea",
  tarjeta: "#19191b",
  acento: "#e8b04a",
  acentoTinta: "#1a1204",
};

const TEMAS: Record<string, Tema> = {
  "barberia-demo": TEMA_BASE,
};

export function getTema(slug: string): Tema {
  return TEMAS[slug] ?? TEMA_BASE;
}

/** Variables CSS del tema, para poner en el contenedor de la página del negocio. */
export function temaStyle(tema: Tema): CSSProperties {
  return {
    "--n-fondo": tema.fondo,
    "--n-texto": tema.texto,
    "--n-tarjeta": tema.tarjeta,
    "--n-acento": tema.acento,
    "--n-acento-tinta": tema.acentoTinta,
  } as CSSProperties;
}
