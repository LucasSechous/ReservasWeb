"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cancelarDesdePanel, marcarAsistencia, quitarBloqueo } from "./actions";

export type EstadoTurno = "confirmada" | "cancelada" | "completada" | "no_show";

export type ItemAgenda = {
  id: string;
  horario: string;
  esBloqueo: boolean;
  servicio: string;
  profesional: string;
  cliente: string;
  telefono: string | null;
  email: string | null;
  notas: string | null;
  origen: string;
  estado: EstadoTurno;
  /** Quién canceló: "cliente" desde su link, "negocio" desde el panel; null en cancelaciones antiguas. */
  canceladaPor: string | null;
  /** El turno ya empezó: recién ahí tiene sentido marcar si vino o no. */
  empezo: boolean;
  /** Día en texto, para los turnos de otro día (por ejemplo los que quedaron sin marcar). */
  fecha?: string;
};

function digitosWhatsapp(telefono: string): string {
  const d = telefono.replace(/\D/g, "");
  return telefono.trim().startsWith("+") || d.startsWith("598") ? d : `598${d.replace(/^0/, "")}`;
}

const boton =
  "inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-bold transition disabled:opacity-40";

export function ReservaItem({ item }: { item: ItemAgenda }) {
  const router = useRouter();
  const [trabajando, setTrabajando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelada = item.estado === "cancelada";
  const vino = item.estado === "completada";
  const faltó = item.estado === "no_show";
  const pendienteDeMarcar = item.estado === "confirmada" && item.empezo && !item.esBloqueo;

  async function ejecutar(accion: () => Promise<{ ok: boolean; mensaje?: string }>) {
    setTrabajando(true);
    setError(null);
    const r = await accion();
    setTrabajando(false);
    setConfirmando(false);
    if (r.ok) router.refresh();
    else setError(r.mensaje ?? "No pudimos hacerlo. Probá de nuevo.");
  }

  const marcar = (estado: "completada" | "no_show" | "confirmada") =>
    ejecutar(() => marcarAsistencia(item.id, estado));
  const cancelar = () =>
    ejecutar(() => (item.esBloqueo ? quitarBloqueo(item.id) : cancelarDesdePanel(item.id)));

  const etiqueta = cancelada
    ? item.canceladaPor === "cliente"
      ? "Canceló el cliente"
      : item.canceladaPor === "negocio"
        ? "Cancelado por el negocio"
        : "Cancelado"
    : vino
      ? "Vino"
      : faltó
        ? "No vino"
        : item.esBloqueo
          ? "Bloqueo"
          : null;

  const colorEtiqueta = vino
    ? "bg-(--n-acento)/20 text-(--n-acento)"
    : faltó || cancelada
      ? "bg-amber-400/15 text-amber-300"
      : "bg-(--n-texto)/10 text-(--n-texto)/70";

  return (
    <li
      className={`rounded-3xl border p-4 sm:p-5 ${
        cancelada
          ? "border-(--n-texto)/5 bg-(--n-texto)/[0.02] opacity-60"
          : item.esBloqueo
            ? "border-dashed border-(--n-texto)/15 bg-(--n-texto)/[0.03]"
            : pendienteDeMarcar
              ? "border-amber-300/40 bg-(--n-tarjeta)"
              : "border-(--n-texto)/10 bg-(--n-tarjeta)"
      }`}
    >
      {item.fecha && (
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-(--n-texto)/50">
          {item.fecha}
        </p>
      )}
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <p className={`font-display text-xl font-extrabold ${cancelada ? "line-through" : ""}`}>
            {item.horario}
          </p>
          <p className="mt-0.5 text-lg font-semibold">
            {item.esBloqueo ? (item.notas ?? "Horario bloqueado") : item.cliente}
          </p>
          <p className="text-sm text-(--n-texto)/60">
            {item.esBloqueo ? "" : `${item.servicio} · `}con {item.profesional}
            {item.origen === "manual" ? " · cargado a mano" : ""}
          </p>
        </div>
        {etiqueta && (
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${colorEtiqueta}`}
          >
            {vino ? "✓ " : faltó ? "✗ " : ""}
            {etiqueta}
          </span>
        )}
      </div>

      {!item.esBloqueo && (item.telefono || item.email) && (
        <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {item.telefono && (
            <>
              <a href={`tel:${item.telefono}`} className="underline">
                {item.telefono}
              </a>
              <a
                href={`https://wa.me/${digitosWhatsapp(item.telefono)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-(--n-acento) underline"
              >
                WhatsApp
              </a>
            </>
          )}
          {item.email && <span className="text-(--n-texto)/55">{item.email}</span>}
        </p>
      )}
      {!item.esBloqueo && item.notas && (
        <p className="mt-2 text-sm text-(--n-texto)/60">Nota: {item.notas}</p>
      )}

      {/* Acciones */}
      {!cancelada && (
        <div className="mt-4">
          {confirmando ? (
            <div
              role="alertdialog"
              aria-label="Confirmar"
              className="flex flex-wrap items-center gap-3 rounded-2xl bg-(--n-fondo)/60 p-3"
            >
              <p className="text-sm font-semibold">
                {item.esBloqueo
                  ? "¿Quitar este bloqueo?"
                  : `¿Cancelar el turno de ${item.cliente}?${item.email ? " Le avisamos por mail." : ""}`}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void cancelar()}
                  disabled={trabajando}
                  className={`${boton} bg-red-400 text-red-950 hover:brightness-110`}
                >
                  {trabajando ? "…" : item.esBloqueo ? "Sí, quitar" : "Sí, cancelar"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmando(false)}
                  className={`${boton} border border-(--n-texto)/25 hover:border-(--n-texto)/60`}
                >
                  No
                </button>
              </div>
            </div>
          ) : pendienteDeMarcar ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-sm font-semibold text-amber-300">¿Vino?</span>
              <button
                type="button"
                onClick={() => void marcar("completada")}
                disabled={trabajando}
                className={`${boton} bg-(--n-acento) text-(--n-acento-tinta) hover:brightness-110`}
              >
                ✓ Sí, vino
              </button>
              <button
                type="button"
                onClick={() => void marcar("no_show")}
                disabled={trabajando}
                className={`${boton} border border-amber-300/50 text-amber-200 hover:bg-amber-300/10`}
              >
                ✗ No vino
              </button>
            </div>
          ) : vino || faltó ? (
            <button
              type="button"
              onClick={() => void marcar("confirmada")}
              disabled={trabajando}
              className="text-sm font-semibold text-(--n-texto)/55 underline hover:text-(--n-texto)"
            >
              Me equivoqué, deshacer
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmando(true)}
              disabled={trabajando}
              className={`${boton} border border-(--n-texto)/20 hover:border-red-300 hover:text-red-200`}
            >
              {item.esBloqueo ? "Quitar bloqueo" : "Cancelar turno"}
            </button>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-(--n-error)">
          {error}
        </p>
      )}
    </li>
  );
}
