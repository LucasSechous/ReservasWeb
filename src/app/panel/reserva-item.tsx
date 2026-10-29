"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cancelarDesdePanel, quitarBloqueo } from "./actions";

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
  cancelada: boolean;
  /** Quién canceló: "cliente" desde su link, "negocio" desde el panel; null en cancelaciones antiguas. */
  canceladaPor: string | null;
};

function digitosWhatsapp(telefono: string): string {
  const d = telefono.replace(/\D/g, "");
  return telefono.trim().startsWith("+") || d.startsWith("598") ? d : `598${d.replace(/^0/, "")}`;
}

export function ReservaItem({ item }: { item: ItemAgenda }) {
  const router = useRouter();
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accion() {
    const mensaje = item.esBloqueo
      ? "¿Quitar este bloqueo? El horario vuelve a quedar libre."
      : `¿Cancelar el turno de ${item.cliente}? Si dejó un mail, le avisamos.`;
    if (!window.confirm(mensaje)) return;

    setTrabajando(true);
    setError(null);
    const r = item.esBloqueo ? await quitarBloqueo(item.id) : await cancelarDesdePanel(item.id);
    setTrabajando(false);
    if (r.ok) router.refresh();
    else setError(r.mensaje);
  }

  return (
    <li
      className={`rounded-2xl border p-4 ${
        item.cancelada
          ? "border-white/5 bg-white/[0.02] opacity-60"
          : item.esBloqueo
            ? "border-white/10 bg-white/[0.03]"
            : "border-white/10 bg-ink-2"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`font-display text-lg font-bold ${item.cancelada ? "line-through" : ""}`}>
            {item.horario}
            {item.cancelada && (
              <span className="ml-2 rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-red-300 no-underline">
                {item.canceladaPor === "cliente"
                  ? "Cancelado por el cliente"
                  : item.canceladaPor === "negocio"
                    ? "Cancelado por el negocio"
                    : "Cancelado"}
              </span>
            )}
            {item.esBloqueo && (
              <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-white/60">
                Bloqueo
              </span>
            )}
          </p>
          <p className="mt-1 font-semibold">
            {item.esBloqueo ? (item.notas ?? "Horario bloqueado") : item.cliente}
          </p>
          <p className="text-sm text-white/55">
            {item.esBloqueo ? "" : `${item.servicio} · `}con {item.profesional}
            {item.origen === "manual" ? " · cargado por el negocio" : ""}
          </p>
          {!item.esBloqueo && (item.telefono || item.email) && (
            <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {item.telefono && (
                <>
                  <a href={`tel:${item.telefono}`} className="underline">
                    {item.telefono}
                  </a>
                  <a
                    href={`https://wa.me/${digitosWhatsapp(item.telefono)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent underline"
                  >
                    WhatsApp
                  </a>
                </>
              )}
              {item.email && <span className="text-white/55">{item.email}</span>}
            </p>
          )}
          {!item.esBloqueo && item.notas && (
            <p className="mt-2 text-sm text-white/55">Nota: {item.notas}</p>
          )}
        </div>
        {!item.cancelada && (
          <button
            type="button"
            onClick={accion}
            disabled={trabajando}
            className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold transition hover:border-red-400 hover:text-red-300 disabled:opacity-40"
          >
            {trabajando ? "…" : item.esBloqueo ? "Quitar" : "Cancelar"}
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-300">
          {error}
        </p>
      )}
    </li>
  );
}
