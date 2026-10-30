import { describe, expect, it } from "vitest";
import { LARGO_MINIMO, contrasenaTemporal } from "./contrasena";

describe("contrasenaTemporal", () => {
  it("es el nombre sin tildes ni símbolos y cuatro números", () => {
    expect(contrasenaTemporal("Peluquería Él")).toMatch(/^peluqueriael\d{4}$/);
  });

  it("recorta los nombres largos", () => {
    expect(contrasenaTemporal("Centro de Estética y Belleza Integral")).toMatch(/^[a-z0-9]{14}\d{4}$/);
  });

  it("sin nombre aprovechable usa «panel»", () => {
    expect(contrasenaTemporal("¡¡¡")).toMatch(/^panel\d{4}$/);
  });

  it("alcanza el largo mínimo que exige el panel", () => {
    expect(contrasenaTemporal("Ab").length).toBeGreaterThanOrEqual(LARGO_MINIMO - 2);
    expect(contrasenaTemporal("panel").length).toBeGreaterThanOrEqual(LARGO_MINIMO);
  });
});
