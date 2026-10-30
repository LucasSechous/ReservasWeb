import { describe, expect, it } from "vitest";
import { getVocabulario } from "./tema";
import { capitalizar, cantidadDe, vocabularioDe } from "./vocabulario";

describe("vocabularioDe", () => {
  it("sin rubro usa las palabras genéricas de siempre", () => {
    const v = vocabularioDe(undefined);
    expect(v.profesional).toBe("profesional");
    expect(v.servicio).toBe("servicio");
    expect(v.equipo).toBe("El equipo");
    expect(v.conQuien).toBe("¿Con quién?");
  });

  it("salud habla de especialistas y consultas", () => {
    const v = vocabularioDe("salud");
    expect(v.profesionales).toBe("especialistas");
    expect(v.servicio).toBe("consulta");
    expect(v.queQueres).toBe("¿Qué consulta necesitás?");
  });

  it("cada rubro define todas las palabras", () => {
    for (const rubro of [
      "barberia",
      "belleza",
      "salud",
      "bienestar",
      "mascotas",
      "entrenamiento",
      "estudio",
    ] as const) {
      const v = vocabularioDe(rubro);
      for (const palabra of Object.values(v)) expect(palabra.trim()).not.toBe("");
    }
  });
});

describe("cantidadDe", () => {
  it("usa el singular con uno y el plural con el resto", () => {
    const v = vocabularioDe("entrenamiento");
    expect(cantidadDe(1, v, "profesional")).toBe("1 entrenador");
    expect(cantidadDe(3, v, "profesional")).toBe("3 entrenadores");
    expect(cantidadDe(1, v, "servicio")).toBe("1 clase");
    expect(cantidadDe(4, v, "servicio")).toBe("4 clases");
  });
});

describe("capitalizar", () => {
  it("pone la primera letra en mayúscula", () => {
    expect(capitalizar("consulta")).toBe("Consulta");
    expect(capitalizar("sesión")).toBe("Sesión");
  });
});

describe("getVocabulario por negocio", () => {
  it("la demo de clínica usa el vocabulario de salud", () => {
    expect(getVocabulario("clinica-demo").profesional).toBe("especialista");
  });

  it("un negocio sin tema propio usa el genérico (lo que ya tenían los negocios existentes)", () => {
    expect(getVocabulario("cualquier-negocio-nuevo").profesional).toBe("profesional");
  });
});
