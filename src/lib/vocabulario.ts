// Las palabras que cambian según el rubro del negocio: una clínica tiene especialistas y consultas,
// un gimnasio tiene entrenadores y clases. El rubro se define en el tema de cada negocio (lib/tema.ts).
// Un negocio sin rubro usa el vocabulario genérico, que es el de siempre.

export type Rubro =
  | "barberia"
  | "belleza"
  | "salud"
  | "bienestar"
  | "mascotas"
  | "entrenamiento"
  | "estudio";

export type Vocabulario = {
  /** Quien atiende, en singular y plural y sin mayúscula: «1 barbero», «3 especialistas». */
  profesional: string;
  profesionales: string;
  /** Lo que se reserva, en singular y plural y sin mayúscula: «servicio», «consulta», «clase». */
  servicio: string;
  servicios: string;
  /** Título de la sección de la landing donde se muestra a quienes atienden. */
  equipo: string;
  /** Pregunta del paso de la reserva donde se elige con quién. */
  conQuien: string;
  /** Título del primer paso de la reserva, donde se elige qué se reserva. */
  queQueres: string;
};

const GENERICO: Vocabulario = {
  profesional: "profesional",
  profesionales: "profesionales",
  servicio: "servicio",
  servicios: "servicios",
  equipo: "El equipo",
  conQuien: "¿Con quién?",
  queQueres: "¿Qué querés hacerte?",
};

const VOCABULARIOS: Record<Rubro, Vocabulario> = {
  barberia: {
    ...GENERICO,
    profesional: "barbero",
    profesionales: "barberos",
    conQuien: "¿Con qué barbero?",
  },
  belleza: GENERICO,
  salud: {
    profesional: "especialista",
    profesionales: "especialistas",
    servicio: "consulta",
    servicios: "consultas",
    equipo: "Nuestros especialistas",
    conQuien: "¿Con qué especialista?",
    queQueres: "¿Qué consulta necesitás?",
  },
  bienestar: {
    profesional: "terapeuta",
    profesionales: "terapeutas",
    servicio: "sesión",
    servicios: "sesiones",
    equipo: "Quiénes te atienden",
    conQuien: "¿Con qué terapeuta?",
    queQueres: "¿Qué sesión querés reservar?",
  },
  mascotas: {
    profesional: "veterinario",
    profesionales: "veterinarios",
    servicio: "consulta",
    servicios: "consultas",
    equipo: "El equipo",
    conQuien: "¿Con qué veterinario?",
    queQueres: "¿Qué necesita tu mascota?",
  },
  entrenamiento: {
    profesional: "entrenador",
    profesionales: "entrenadores",
    servicio: "clase",
    servicios: "clases",
    equipo: "Nuestros entrenadores",
    conQuien: "¿Con qué entrenador?",
    queQueres: "¿Qué clase querés tomar?",
  },
  estudio: {
    profesional: "profesional",
    profesionales: "profesionales",
    servicio: "consulta",
    servicios: "consultas",
    equipo: "Nuestro equipo",
    conQuien: "¿Con quién?",
    queQueres: "¿Qué consulta necesitás?",
  },
};

export function vocabularioDe(rubro?: Rubro): Vocabulario {
  return rubro ? VOCABULARIOS[rubro] : GENERICO;
}

/** «3 barberos», «1 especialista». */
export function cantidadDe(n: number, v: Vocabulario, que: "profesional" | "servicio"): string {
  const uno = que === "profesional" ? v.profesional : v.servicio;
  const varios = que === "profesional" ? v.profesionales : v.servicios;
  return n === 1 ? `1 ${uno}` : `${n} ${varios}`;
}

export function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
