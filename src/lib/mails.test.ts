import { describe, expect, it } from "vitest";
import { mailAvisoAusencias, mailRecordatorio } from "./mails";

const base = {
  negocio: "Barbería Demo",
  servicio: "Corte",
  profesional: "Martín",
  cuando: "mañana a las 10:00",
  direccion: "Gorlero 123",
};

describe("mailRecordatorio", () => {
  it("nombra al negocio y trae los datos del turno en las dos versiones", () => {
    const m = mailRecordatorio({ ...base, telefono: "099 123 456" });
    expect(m.asunto).toContain("Barbería Demo");
    for (const parte of [m.html, m.texto]) {
      expect(parte).toContain("Corte");
      expect(parte).toContain("Martín");
      expect(parte).toContain("mañana a las 10:00");
      expect(parte).toContain("Gorlero 123");
    }
  });

  it("si el negocio tiene teléfono, lo ofrece para avisar si no se puede ir", () => {
    expect(mailRecordatorio({ ...base, telefono: "099 123 456" }).texto).toContain("099 123 456");
  });

  it("sin teléfono manda a usar el link del mail de confirmación", () => {
    expect(mailRecordatorio({ ...base, telefono: null }).texto).toContain("link del mail de confirmación");
  });

  it("sin dirección no deja una línea vacía de «Dirección»", () => {
    expect(mailRecordatorio({ ...base, direccion: null, telefono: null }).texto).not.toContain("Dirección");
  });
});

describe("mailAvisoAusencias", () => {
  it("dice quién y cuántas veces faltó, solo para el dueño", () => {
    const m = mailAvisoAusencias({
      negocio: "Barbería Demo",
      cliente: "Ana Pérez",
      cuando: "mañana a las 10:00",
      ausencias: 6,
    });
    expect(m.asunto).toContain("Ana Pérez");
    expect(m.texto).toContain("6 veces");
    expect(m.texto).toContain("Este dato lo ves solo vos");
  });
});
