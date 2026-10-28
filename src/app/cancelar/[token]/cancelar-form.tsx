"use client";

import Link from "next/link";
import { useState } from "react";
import { type ResultadoCancelacion, cancelarTurno } from "./actions";

const MENSAJES: Record<string, string> = {
  YA_CANCELADA: "Este turno ya estaba cancelado.",
  YA_PASO: "Este turno ya pasó y no se puede cancelar.",
  NO_EXISTE: "No encontramos este turno.",
  ERROR: "No pudimos cancelar el turno. Probá de nuevo en unos minutos.",
};

export function CancelarForm({ token, slug }: { token: string; slug: string }) {
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoCancelacion | null>(null);

  async function cancelar() {
    setEnviando(true);
    setResultado(await cancelarTurno(token));
    setEnviando(false);
  }

  if (resultado?.ok) {
    return (
      <div className="rounded-2xl border border-(--n-acento)/50 bg-(--n-acento)/10 p-6">
        <p className="text-lg font-bold">Listo, cancelamos tu turno.</p>
        <p className="mt-1 text-sm text-white/70">El horario volvió a quedar libre.</p>
        <Link
          href={`/${slug}/reservar`}
          className="mt-5 inline-flex min-h-12 items-center rounded-full bg-(--n-acento) px-6 font-bold text-(--n-acento-tinta)"
        >
          Reservar otro turno
        </Link>
      </div>
    );
  }

  return (
    <div>
      {resultado && !resultado.ok && (
        <p
          role="alert"
          className="mb-4 rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          {MENSAJES[resultado.codigo]}
        </p>
      )}
      <button
        type="button"
        onClick={cancelar}
        disabled={enviando}
        className="inline-flex min-h-12 items-center rounded-full bg-(--n-acento) px-6 font-bold text-(--n-acento-tinta) transition hover:brightness-110 disabled:opacity-50"
      >
        {enviando ? "Cancelando…" : "Sí, cancelar mi turno"}
      </button>
      <Link
        href={`/${slug}`}
        className="ml-3 inline-flex min-h-12 items-center rounded-full border border-white/20 px-6 font-bold"
      >
        No, volver
      </Link>
    </div>
  );
}
