"use client";

import { useMemo, useState } from "react";
import { formatoHora, listarDias } from "@/lib/fechas";

// Elegir día y hora. Lo usan la reserva nueva (/[slug]/reservar) y reprogramar (/reserva/[token]).
// Los colores salen de las variables --n-* del tema del negocio.

export type TurnoElegible = {
  profesionalId: string;
  inicio: string;
  fin: string;
};

export function SelectorDia({
  timezone,
  ventanaDias,
  fecha,
  onElegir,
}: {
  timezone: string;
  ventanaDias: number;
  fecha: string | null;
  onElegir: (fecha: string) => void;
}) {
  const [verMas, setVerMas] = useState(false);
  const dias = useMemo(
    () => listarDias(timezone, verMas ? ventanaDias + 1 : Math.min(14, ventanaDias + 1)),
    [timezone, ventanaDias, verMas],
  );

  return (
    <>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-7">
        {dias.map((d) => (
          <button
            key={d.fecha}
            type="button"
            onClick={() => onElegir(d.fecha)}
            aria-pressed={fecha === d.fecha}
            className={`flex flex-col items-center rounded-2xl border py-3 transition ${
              fecha === d.fecha
                ? "border-(--n-acento) bg-(--n-acento) text-(--n-acento-tinta)"
                : "border-white/10 bg-(--n-tarjeta) hover:border-white/30"
            }`}
          >
            <span className="text-[11px] uppercase opacity-70">{d.diaSemana}</span>
            <span className="text-lg font-extrabold">{d.numero}</span>
            <span className="text-[11px] uppercase opacity-70">{d.mes}</span>
          </button>
        ))}
      </div>
      {!verMas && ventanaDias + 1 > 14 && (
        <button
          type="button"
          onClick={() => setVerMas(true)}
          className="mt-4 text-sm font-semibold text-(--n-acento) underline"
        >
          Ver más fechas
        </button>
      )}
    </>
  );
}

export function SelectorHora({
  turnos,
  timezone,
  inicio,
  cargando,
  onElegir,
}: {
  turnos: TurnoElegible[];
  timezone: string;
  inicio: string | null;
  cargando: boolean;
  onElegir: (inicio: string) => void;
}) {
  // Sin elegir profesional, cada hora aparece una sola vez aunque varios estén libres.
  const franjas = useMemo(() => {
    const vistos = new Set<string>();
    const manana: TurnoElegible[] = [];
    const tarde: TurnoElegible[] = [];
    for (const t of turnos) {
      if (vistos.has(t.inicio)) continue;
      vistos.add(t.inicio);
      const hora = Number(formatoHora(t.inicio, timezone).slice(0, 2));
      (hora < 13 ? manana : tarde).push(t);
    }
    return [
      { nombre: "Mañana", turnos: manana },
      { nombre: "Tarde", turnos: tarde },
    ].filter((f) => f.turnos.length > 0);
  }, [turnos, timezone]);

  if (cargando) return <p className="mt-8 text-white/60">Buscando horarios libres…</p>;

  if (franjas.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-white/10 bg-(--n-tarjeta) p-6">
        <p className="font-semibold">No quedan horarios libres ese día.</p>
        <p className="mt-1 text-sm text-white/60">Probá con otra fecha.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      {franjas.map((f) => (
        <div key={f.nombre}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/50">
            {f.nombre}
          </h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
            {f.turnos.map((t) => (
              <button
                key={t.inicio}
                type="button"
                aria-pressed={inicio === t.inicio}
                onClick={() => onElegir(t.inicio)}
                className={`rounded-xl border py-3 font-bold transition ${
                  inicio === t.inicio
                    ? "border-(--n-acento) bg-(--n-acento) text-(--n-acento-tinta)"
                    : "border-white/10 bg-(--n-tarjeta) hover:border-white/30"
                }`}
              >
                {formatoHora(t.inicio, timezone)}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
