// «Agregar a mi calendario» después de reservar: un link a Google Calendar y un archivo .ics
// (lo abren el calendario del iPhone, Outlook y casi cualquier otro).

export type Evento = {
  titulo: string;
  /** Instantes ISO (UTC). */
  inicio: string;
  fin: string;
  lugar?: string | null;
  detalle?: string;
};

/** "2026-11-12T13:00:00.000Z" → "20261112T130000Z". */
function formatoUtc(instante: string): string {
  return new Date(instante).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function linkGoogleCalendar(e: Evento): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.titulo,
    dates: `${formatoUtc(e.inicio)}/${formatoUtc(e.fin)}`,
  });
  if (e.detalle) params.set("details", e.detalle);
  if (e.lugar) params.set("location", e.lugar);
  return `https://calendar.google.com/calendar/render?${params}`;
}

/** Escapa un texto para un campo de iCalendar (RFC 5545). */
function textoIcs(texto: string): string {
  return texto.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

export function archivoIcs(e: Evento, uid: string): string {
  const lineas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Tu Turno//Reservas//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatoUtc(new Date().toISOString())}`,
    `DTSTART:${formatoUtc(e.inicio)}`,
    `DTEND:${formatoUtc(e.fin)}`,
    `SUMMARY:${textoIcs(e.titulo)}`,
    ...(e.lugar ? [`LOCATION:${textoIcs(e.lugar)}`] : []),
    ...(e.detalle ? [`DESCRIPTION:${textoIcs(e.detalle)}`] : []),
    // Aviso una hora antes.
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${textoIcs(e.titulo)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lineas.join("\r\n");
}

export function linkIcs(e: Evento, uid: string): string {
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(archivoIcs(e, uid))}`;
}
