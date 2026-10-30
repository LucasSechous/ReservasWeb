import type { Rubro } from "@/lib/vocabulario";

// Puntos de partida para dar de alta un negocio: cargan los servicios, el horario y los plazos típicos
// del rubro, y después se ajusta todo a mano. Los precios son orientativos: siempre hay que cambiarlos.

export type DiaHorario = { activo: boolean; d1: string; h1: string; d2: string; h2: string };
export type FilaServicio = { nombre: string; descripcion: string; minutos: string; precio: string };

const dia = (d1: string, h1: string, d2 = "", h2 = ""): DiaHorario => ({
  activo: true,
  d1,
  h1,
  d2,
  h2,
});
const cerrado = (): DiaHorario => ({ activo: false, d1: "09:00", h1: "13:00", d2: "", h2: "" });

/** De lunes a viernes con horario partido y sábado de mañana: lo más común en comercios de belleza. */
export const HORARIO_COMERCIAL: Record<number, DiaHorario> = {
  1: dia("09:00", "13:00", "14:00", "19:00"),
  2: dia("09:00", "13:00", "14:00", "19:00"),
  3: dia("09:00", "13:00", "14:00", "19:00"),
  4: dia("09:00", "13:00", "14:00", "19:00"),
  5: dia("09:00", "13:00", "14:00", "19:00"),
  6: dia("09:00", "14:00"),
  0: cerrado(),
};

/** Consultorio: de lunes a viernes de 9 a 13 y de 14 a 18; sábado cerrado. */
export const HORARIO_CONSULTORIO: Record<number, DiaHorario> = {
  1: dia("09:00", "13:00", "14:00", "18:00"),
  2: dia("09:00", "13:00", "14:00", "18:00"),
  3: dia("09:00", "13:00", "14:00", "18:00"),
  4: dia("09:00", "13:00", "14:00", "18:00"),
  5: dia("09:00", "13:00", "14:00", "18:00"),
  6: cerrado(),
  0: cerrado(),
};

/** Entrenamiento: temprano a la mañana y a la tarde-noche, de lunes a viernes. */
export const HORARIO_ENTRENAMIENTO: Record<number, DiaHorario> = {
  1: dia("07:00", "11:00", "17:00", "21:00"),
  2: dia("07:00", "11:00", "17:00", "21:00"),
  3: dia("07:00", "11:00", "17:00", "21:00"),
  4: dia("07:00", "11:00", "17:00", "21:00"),
  5: dia("07:00", "11:00", "17:00", "20:00"),
  6: dia("09:00", "12:00"),
  0: cerrado(),
};

export type Plantilla = {
  id: string;
  nombre: string;
  /** Rubro del tema (lib/tema.ts) que le corresponde: define las palabras de la web y del panel. */
  rubro: Rubro;
  servicios: FilaServicio[];
  horario: Record<number, DiaHorario>;
  anticipacion: string;
  ventana: string;
};

const s = (nombre: string, minutos: number, precio: number, descripcion = ""): FilaServicio => ({
  nombre,
  descripcion,
  minutos: String(minutos),
  precio: String(precio),
});

export const PLANTILLAS: Plantilla[] = [
  {
    id: "barberia",
    nombre: "Barbería",
    rubro: "barberia",
    servicios: [
      s("Corte", 30, 500, "Corte clásico o a la moda."),
      s("Barba", 20, 350, "Perfilado y arreglo de barba."),
      s("Corte + barba", 45, 750),
      s("Perfilado", 15, 250),
    ],
    horario: HORARIO_COMERCIAL,
    anticipacion: "60",
    ventana: "30",
  },
  {
    id: "peluqueria",
    nombre: "Peluquería",
    rubro: "belleza",
    servicios: [
      s("Corte", 45, 900, "Corte y peinado."),
      s("Color de raíz", 90, 1800, "Retoque de raíz con tinte de calidad."),
      s("Brushing", 40, 700, "Lavado, secado y brushing."),
      s("Mechas", 150, 3500, "Mechas o balayage, con tratamiento incluido."),
    ],
    horario: HORARIO_COMERCIAL,
    anticipacion: "120",
    ventana: "30",
  },
  {
    id: "estetica",
    nombre: "Centro de estética",
    rubro: "belleza",
    servicios: [
      s("Limpieza facial", 60, 1800, "Limpieza profunda, exfoliación y máscara hidratante."),
      s("Masaje relajante", 60, 1600),
      s("Depilación", 45, 1200),
      s("Manicuría", 45, 700, "Limado, cutículas y esmaltado semipermanente."),
      s("Perfilado de cejas", 20, 450),
    ],
    horario: HORARIO_COMERCIAL,
    anticipacion: "120",
    ventana: "45",
  },
  {
    id: "unas",
    nombre: "Uñas y pestañas",
    rubro: "belleza",
    servicios: [
      s("Esmaltado semipermanente", 45, 700),
      s("Uñas esculpidas", 120, 1800),
      s("Lifting de pestañas", 60, 1500),
      s("Extensiones de pestañas", 120, 2200),
    ],
    horario: HORARIO_COMERCIAL,
    anticipacion: "120",
    ventana: "45",
  },
  {
    id: "clinica",
    nombre: "Clínica o consultorio médico",
    rubro: "salud",
    servicios: [
      s("Consulta general", 30, 1500),
      s("Consulta de control", 20, 1000),
      s("Consulta de especialidad", 40, 2200),
    ],
    horario: HORARIO_CONSULTORIO,
    anticipacion: "240",
    ventana: "60",
  },
  {
    id: "dental",
    nombre: "Odontología",
    rubro: "salud",
    servicios: [
      s("Consulta y diagnóstico", 30, 1200),
      s("Limpieza dental", 45, 1800),
      s("Blanqueamiento", 60, 5000),
      s("Urgencia", 30, 1500),
    ],
    horario: HORARIO_CONSULTORIO,
    anticipacion: "120",
    ventana: "60",
  },
  {
    id: "nutricion-psicologia",
    nombre: "Nutrición o psicología",
    rubro: "bienestar",
    servicios: [
      s("Primera consulta", 60, 1800),
      s("Sesión de seguimiento", 45, 1400),
      s("Sesión online", 45, 1400),
    ],
    horario: HORARIO_CONSULTORIO,
    anticipacion: "240",
    ventana: "60",
  },
  {
    id: "kinesiologia",
    nombre: "Kinesiología o fisioterapia",
    rubro: "bienestar",
    servicios: [s("Evaluación inicial", 45, 1500), s("Sesión", 45, 1300), s("Sesión de masajes", 60, 1600)],
    horario: HORARIO_CONSULTORIO,
    anticipacion: "240",
    ventana: "45",
  },
  {
    id: "veterinaria",
    nombre: "Veterinaria",
    rubro: "mascotas",
    servicios: [
      s("Consulta", 30, 1200),
      s("Vacunación", 20, 800),
      s("Baño y corte", 60, 1500),
    ],
    horario: HORARIO_COMERCIAL,
    anticipacion: "120",
    ventana: "30",
  },
  {
    id: "entrenamiento",
    nombre: "Entrenador, gimnasio o yoga",
    rubro: "entrenamiento",
    servicios: [s("Clase individual", 60, 900), s("Evaluación inicial", 45, 700), s("Clase de prueba", 60, 0)],
    horario: HORARIO_ENTRENAMIENTO,
    anticipacion: "120",
    ventana: "30",
  },
  {
    id: "estudio",
    nombre: "Estudio profesional",
    rubro: "estudio",
    servicios: [s("Consulta inicial", 45, 2000), s("Reunión de seguimiento", 30, 1500)],
    horario: HORARIO_CONSULTORIO,
    anticipacion: "480",
    ventana: "60",
  },
  {
    id: "tatuajes",
    nombre: "Estudio de tatuajes",
    rubro: "belleza",
    servicios: [s("Consulta de diseño", 30, 0), s("Sesión de tatuaje", 180, 6000), s("Piercing", 30, 1200)],
    horario: HORARIO_COMERCIAL,
    anticipacion: "1440",
    ventana: "60",
  },
];
