// Plantillas de los mails transaccionales, en español rioplatense.
// Todo dato que viene de una persona se escapa antes de ir al HTML.
export type Mail = { asunto: string; html: string; texto: string };

function esc(valor: string): string {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function plantilla(opciones: {
  titulo: string;
  lineas: { etiqueta: string; valor: string }[];
  pie?: string;
  boton?: { texto: string; url: string };
}): string {
  const filas = opciones.lineas
    .map(
      (l) =>
        `<tr><td style="padding:6px 16px 6px 0;color:#6b6b6b;font-size:14px;">${esc(l.etiqueta)}</td><td style="padding:6px 0;font-size:15px;font-weight:600;color:#111;">${esc(l.valor)}</td></tr>`,
    )
    .join("");
  const boton = opciones.boton
    ? `<p style="margin:24px 0 0;"><a href="${esc(opciones.boton.url)}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:999px;">${esc(opciones.boton.texto)}</a></p>`
    : "";
  const pie = opciones.pie
    ? `<p style="margin:24px 0 0;font-size:13px;color:#6b6b6b;">${esc(opciones.pie)}</p>`
    : "";

  return `<!doctype html><html lang="es"><body style="margin:0;background:#f4f4f2;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;"><div style="max-width:520px;margin:0 auto;padding:32px 16px;"><div style="background:#fff;border-radius:16px;padding:28px;"><h1 style="margin:0 0 16px;font-size:22px;color:#111;">${esc(opciones.titulo)}</h1><table role="presentation" style="border-collapse:collapse;">${filas}</table>${boton}${pie}</div><p style="text-align:center;font-size:12px;color:#9a9a9a;margin:16px 0 0;">Enviado por ReservasWeb</p></div></body></html>`;
}

function texto(titulo: string, lineas: { etiqueta: string; valor: string }[], extra?: string): string {
  return [titulo, "", ...lineas.map((l) => `${l.etiqueta}: ${l.valor}`), ...(extra ? ["", extra] : [])].join("\n");
}

export function mailConfirmacionCliente(d: {
  negocio: string;
  servicio: string;
  profesional: string;
  cuando: string;
  direccion: string | null;
  cancelarUrl: string;
}): Mail {
  const titulo = "¡Reserva confirmada!";
  const lineas = [
    { etiqueta: "Dónde", valor: d.negocio },
    ...(d.direccion ? [{ etiqueta: "Dirección", valor: d.direccion }] : []),
    { etiqueta: "Servicio", valor: d.servicio },
    { etiqueta: "Cuándo", valor: d.cuando },
    { etiqueta: "Con", valor: d.profesional },
  ];
  return {
    asunto: `Reserva confirmada en ${d.negocio}`,
    html: plantilla({
      titulo,
      lineas,
      boton: { texto: "Cancelar este turno", url: d.cancelarUrl },
      pie: "Si no podés venir, cancelá tu turno con el botón para que otra persona pueda usar el horario.",
    }),
    texto: texto(titulo, lineas, `Para cancelar tu turno: ${d.cancelarUrl}`),
  };
}

export function mailAvisoReserva(d: {
  negocio: string;
  servicio: string;
  profesional: string;
  cuando: string;
  cliente: string;
  telefono: string;
  email: string | null;
}): Mail {
  const titulo = "Nueva reserva";
  const lineas = [
    { etiqueta: "Cliente", valor: d.cliente },
    { etiqueta: "Teléfono", valor: d.telefono },
    ...(d.email ? [{ etiqueta: "Mail", valor: d.email }] : []),
    { etiqueta: "Servicio", valor: d.servicio },
    { etiqueta: "Cuándo", valor: d.cuando },
    { etiqueta: "Con", valor: d.profesional },
  ];
  return {
    asunto: `Nueva reserva: ${d.cliente}, ${d.cuando}`,
    html: plantilla({ titulo, lineas, pie: `Reserva hecha en la web de ${d.negocio}.` }),
    texto: texto(titulo, lineas, `Reserva hecha en la web de ${d.negocio}.`),
  };
}

export function mailAvisoCancelacion(d: {
  negocio: string;
  servicio: string;
  profesional: string;
  cuando: string;
  cliente: string;
}): Mail {
  const titulo = "Turno cancelado";
  const lineas = [
    { etiqueta: "Cliente", valor: d.cliente },
    { etiqueta: "Servicio", valor: d.servicio },
    { etiqueta: "Cuándo", valor: d.cuando },
    { etiqueta: "Con", valor: d.profesional },
  ];
  return {
    asunto: `Turno cancelado: ${d.cliente}, ${d.cuando}`,
    html: plantilla({ titulo, lineas, pie: `El horario volvió a quedar libre en la web de ${d.negocio}.` }),
    texto: texto(titulo, lineas, `El horario volvió a quedar libre en la web de ${d.negocio}.`),
  };
}

export function mailCancelacionCliente(d: {
  negocio: string;
  servicio: string;
  cuando: string;
  reservarUrl: string;
}): Mail {
  const titulo = "Cancelaste tu turno";
  const lineas = [
    { etiqueta: "Dónde", valor: d.negocio },
    { etiqueta: "Servicio", valor: d.servicio },
    { etiqueta: "Cuándo", valor: d.cuando },
  ];
  return {
    asunto: `Turno cancelado en ${d.negocio}`,
    html: plantilla({
      titulo,
      lineas,
      boton: { texto: "Reservar otro turno", url: d.reservarUrl },
    }),
    texto: texto(titulo, lineas, `Para reservar otro turno: ${d.reservarUrl}`),
  };
}
