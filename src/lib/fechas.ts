// Fechas en la zona horaria del negocio. Todo se guarda en UTC (timestamptz) y se muestra en hora local.

/** Hoy en la zona del negocio, como "AAAA-MM-DD". */
export function hoyEn(timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Suma días a una fecha "AAAA-MM-DD" sin depender de la zona horaria de quien la ejecuta. */
export function sumarDias(fecha: string, dias: number): string {
  const [a, m, d] = fecha.split("-").map(Number);
  const f = new Date(Date.UTC(a, m - 1, d + dias));
  return f.toISOString().slice(0, 10);
}

export type DiaOpcion = { fecha: string; diaSemana: string; numero: string; mes: string };

/** Lista de días consecutivos desde hoy (en hora del negocio). */
export function listarDias(timezone: string, cantidad: number): DiaOpcion[] {
  const hoy = hoyEn(timezone);
  return Array.from({ length: cantidad }, (_, i) => {
    const fecha = sumarDias(hoy, i);
    const [a, m, d] = fecha.split("-").map(Number);
    const ref = new Date(Date.UTC(a, m - 1, d, 12));
    return {
      fecha,
      diaSemana: new Intl.DateTimeFormat("es-UY", { weekday: "short", timeZone: "UTC" })
        .format(ref)
        .replace(".", ""),
      numero: String(d),
      mes: new Intl.DateTimeFormat("es-UY", { month: "short", timeZone: "UTC" })
        .format(ref)
        .replace(".", ""),
    };
  });
}

/** "17:30" en la hora local del negocio. */
export function formatoHora(instante: string, timezone: string): string {
  return new Intl.DateTimeFormat("es-UY", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timezone,
  }).format(new Date(instante));
}

/** "miércoles 29 de octubre" para una fecha "AAAA-MM-DD". */
export function formatoFechaLarga(fecha: string): string {
  const [a, m, d] = fecha.split("-").map(Number);
  return new Intl.DateTimeFormat("es-UY", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(a, m - 1, d, 12)));
}

/** "miércoles 29 de octubre, 17:30" para un instante, en hora del negocio. */
export function formatoInstanteLargo(instante: string, timezone: string): string {
  const f = new Date(instante);
  const dia = new Intl.DateTimeFormat("es-UY", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: timezone,
  }).format(f);
  return `${dia}, ${formatoHora(instante, timezone)}`;
}

/** Minutos que `timezone` está adelantada respecto de UTC en ese instante (Montevideo: -180). */
function desfaseMinutos(instanteMs: number, timezone: string): number {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(instanteMs));
  const valor = (tipo: string) => Number(partes.find((p) => p.type === tipo)?.value);
  const comoUtc = Date.UTC(
    valor("year"),
    valor("month") - 1,
    valor("day"),
    valor("hour"),
    valor("minute"),
    valor("second"),
  );
  return Math.round((comoUtc - instanteMs) / 60000);
}

/** El instante (ISO, en UTC) que corresponde a "fecha hora" en la zona del negocio. */
export function instanteLocal(fecha: string, hora: string, timezone: string): string {
  const [a, m, d] = fecha.split("-").map(Number);
  const [h, min] = hora.split(":").map(Number);
  const supuesto = Date.UTC(a, m - 1, d, h, min);
  return new Date(supuesto - desfaseMinutos(supuesto, timezone) * 60000).toISOString();
}

/** La fecha "AAAA-MM-DD" (en la zona del negocio) a la que pertenece un instante. */
export function fechaLocalDe(instante: string, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(instante));
}

/** Convierte el rango que devuelve Postgres (`["2026-11-03 13:00:00+00","2026-11-03 13:30:00+00")`) en dos instantes ISO. */
export function parseRango(rango: string): { inicio: string; fin: string } {
  const [inicio, fin] = (rango.match(/"([^"]+)"/g) ?? []).map((t) =>
    new Date(t.replace(/"/g, "").replace(" ", "T").replace(/([+-]\d{2})$/, "$1:00")).toISOString(),
  );
  return { inicio, fin };
}
