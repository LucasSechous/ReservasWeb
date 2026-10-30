import { describe, expect, it } from "vitest";
import { slugPorDominio } from "./dominios";

const mapa = { "barberiaelfaro.com.uy": "barberia-el-faro" };

describe("slugPorDominio", () => {
  it("encuentra el negocio por su dominio", () => {
    expect(slugPorDominio("barberiaelfaro.com.uy", mapa)).toBe("barberia-el-faro");
  });

  it("ignora el www, el puerto y las mayúsculas", () => {
    expect(slugPorDominio("WWW.BarberiaElFaro.com.uy", mapa)).toBe("barberia-el-faro");
    expect(slugPorDominio("barberiaelfaro.com.uy:443", mapa)).toBe("barberia-el-faro");
  });

  it("devuelve null para el dominio de Tu Turno y para los desconocidos", () => {
    expect(slugPorDominio("tuturno.uy", mapa)).toBeNull();
    expect(slugPorDominio("otro.com", mapa)).toBeNull();
    expect(slugPorDominio(null, mapa)).toBeNull();
    expect(slugPorDominio("", mapa)).toBeNull();
  });

  it("no confunde nombres propios de objetos con dominios", () => {
    expect(slugPorDominio("constructor", mapa)).toBeNull();
    expect(slugPorDominio("__proto__", mapa)).toBeNull();
  });

  it("sin dominios cargados (como está hoy) nunca reescribe nada", () => {
    expect(slugPorDominio("tuturno.uy")).toBeNull();
    expect(slugPorDominio("localhost:3000")).toBeNull();
  });
});
