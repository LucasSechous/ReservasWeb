import { describe, expect, it } from "vitest";
import { buildGestionUrl, generarToken, hashToken, tokenValido } from "./gestion";

describe("token de gestión", () => {
  it("el token generado es válido y distinto cada vez", () => {
    const a = generarToken();
    const b = generarToken();
    expect(tokenValido(a)).toBe(true);
    expect(a).not.toBe(b);
  });

  it("rechaza lo que no tiene forma de token", () => {
    expect(tokenValido("")).toBe(false);
    expect(tokenValido("corto")).toBe(false);
    expect(tokenValido(`${"a".repeat(42)}!`)).toBe(false);
    expect(tokenValido(`${"a".repeat(44)}`)).toBe(false);
    expect(tokenValido(null)).toBe(false);
    expect(tokenValido(123)).toBe(false);
  });

  it("el hash es un sha256 en hexadecimal, siempre igual para el mismo token", () => {
    const t = generarToken();
    expect(hashToken(t)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashToken(t)).toBe(hashToken(t));
    expect(hashToken(t)).not.toBe(hashToken(generarToken()));
  });

  it("el hash no deja ver el token (no lo contiene)", () => {
    const t = generarToken();
    expect(hashToken(t)).not.toContain(t);
  });

  it("arma el link sin duplicar la barra final de la dirección", () => {
    const t = generarToken();
    expect(buildGestionUrl(t, "https://tuturno.uy/")).toBe(`https://tuturno.uy/reserva/${t}`);
    expect(buildGestionUrl(t, "https://tuturno.uy")).toBe(`https://tuturno.uy/reserva/${t}`);
  });
});
