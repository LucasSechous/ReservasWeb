import { describe, expect, it } from "vitest";
import { UMBRAL_AUSENCIAS, claveCliente, digitosTelefono } from "./clientes";

describe("digitosTelefono", () => {
  it("deja solo los dígitos y saca el 0 inicial", () => {
    expect(digitosTelefono("099 123 456")).toBe("99123456");
  });

  it("saca el 598 de Uruguay", () => {
    expect(digitosTelefono("+598 99 123 456")).toBe("99123456");
    expect(digitosTelefono("59899123456")).toBe("99123456");
  });

  it("el mismo número escrito de distintas formas da lo mismo", () => {
    const formas = ["099123456", "099 123 456", "+598 99 123 456", "(099) 123-456"];
    expect(new Set(formas.map(digitosTelefono)).size).toBe(1);
  });

  it("no se rompe con vacíos", () => {
    expect(digitosTelefono(null)).toBe("");
    expect(digitosTelefono(undefined)).toBe("");
    expect(digitosTelefono("")).toBe("");
  });
});

describe("claveCliente", () => {
  it("usa el teléfono primero", () => {
    expect(claveCliente({ telefono: "099 123 456", email: "a@b.com", nombre: "Ana" })).toBe(
      "t:99123456",
    );
  });

  it("dos escrituras del mismo teléfono son el mismo cliente", () => {
    expect(claveCliente({ telefono: "099123456" })).toBe(claveCliente({ telefono: "+598 99 123 456" }));
  });

  it("sin teléfono usa el mail, sin importar mayúsculas", () => {
    expect(claveCliente({ telefono: "", email: " Ana@Mail.COM " })).toBe("e:ana@mail.com");
  });

  it("un teléfono demasiado corto no cuenta y cae al mail", () => {
    expect(claveCliente({ telefono: "123", email: "ana@mail.com" })).toBe("e:ana@mail.com");
  });

  it("sin teléfono ni mail usa el nombre, normalizado", () => {
    expect(claveCliente({ telefono: "", email: "", nombre: "  Ana   Pérez " })).toBe("n:ana pérez");
  });

  it("un turno cargado a mano sin teléfono (vacío) no se mezcla con otro cliente", () => {
    expect(claveCliente({ telefono: "", nombre: "Ana" })).not.toBe(claveCliente({ telefono: "", nombre: "Beto" }));
  });
});

describe("UMBRAL_AUSENCIAS", () => {
  it("son 5 ausencias, como se acordó", () => {
    expect(UMBRAL_AUSENCIAS).toBe(5);
  });
});
