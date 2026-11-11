import { describe, expect, it } from "vitest";
import { archivoIcs, linkGoogleCalendar } from "./calendario";

const evento = {
  titulo: "Corte + barba en Barbería Demo",
  inicio: "2026-11-12T13:00:00.000Z",
  fin: "2026-11-12T13:45:00.000Z",
  lugar: "18 de Julio 1234, Maldonado",
  detalle: "Con Martín.\nPara cancelar: https://ejemplo.uy/reserva/abc",
};

describe("calendario", () => {
  it("arma el link de Google Calendar con las horas en UTC", () => {
    const url = new URL(linkGoogleCalendar(evento));
    expect(url.hostname).toBe("calendar.google.com");
    expect(url.searchParams.get("dates")).toBe("20261112T130000Z/20261112T134500Z");
    expect(url.searchParams.get("text")).toBe(evento.titulo);
    expect(url.searchParams.get("location")).toBe(evento.lugar);
  });

  it("arma un .ics válido y escapa comas, punto y coma y saltos de línea", () => {
    const ics = archivoIcs(evento, "abc@tuturno");
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("DTSTART:20261112T130000Z");
    expect(ics).toContain("DTEND:20261112T134500Z");
    expect(ics).toContain("LOCATION:18 de Julio 1234\\, Maldonado");
    expect(ics).toContain("DESCRIPTION:Con Martín.\\nPara cancelar");
    expect(ics.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
  });
});
