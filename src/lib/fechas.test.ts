import { describe, expect, it } from "vitest";
import { fechaLocalDe, instanteLocal, parseRango, sumarDias } from "./fechas";

const MVD = "America/Montevideo"; // UTC-3 todo el año

describe("sumarDias", () => {
  it("cruza el fin de mes y de año", () => {
    expect(sumarDias("2026-10-31", 1)).toBe("2026-11-01");
    expect(sumarDias("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("resta días y respeta los años bisiestos", () => {
    expect(sumarDias("2026-03-01", -1)).toBe("2026-02-28");
    expect(sumarDias("2028-03-01", -1)).toBe("2028-02-29");
  });

  it("sumar 0 deja la fecha igual", () => {
    expect(sumarDias("2026-10-30", 0)).toBe("2026-10-30");
  });
});

describe("instanteLocal y fechaLocalDe", () => {
  it("las 10:00 en Montevideo son las 13:00 UTC", () => {
    expect(instanteLocal("2026-11-04", "10:00", MVD)).toBe("2026-11-04T13:00:00.000Z");
  });

  it("un turno a las 22:00 locales cae al día siguiente en UTC, pero su fecha local es la de hoy", () => {
    const instante = instanteLocal("2026-11-04", "22:00", MVD);
    expect(instante).toBe("2026-11-05T01:00:00.000Z");
    expect(fechaLocalDe(instante, MVD)).toBe("2026-11-04");
  });

  it("ida y vuelta: la fecha local de un instante local es la fecha original", () => {
    for (const hora of ["00:00", "09:15", "23:45"]) {
      expect(fechaLocalDe(instanteLocal("2026-11-04", hora, MVD), MVD)).toBe("2026-11-04");
    }
  });
});

describe("parseRango", () => {
  it("convierte el rango de Postgres en dos instantes ISO", () => {
    const { inicio, fin } = parseRango('["2026-11-03 13:00:00+00","2026-11-03 13:30:00+00")');
    expect(inicio).toBe("2026-11-03T13:00:00.000Z");
    expect(fin).toBe("2026-11-03T13:30:00.000Z");
  });

  it("entiende rangos con otra zona horaria", () => {
    const { inicio } = parseRango('["2026-11-03 10:00:00-03","2026-11-03 10:30:00-03")');
    expect(inicio).toBe("2026-11-03T13:00:00.000Z");
  });
});
