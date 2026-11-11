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

/** Cuántos días se muestran antes de «Ver más fechas». */
export const DIAS_INICIALES = 14;

export function SelectorDia({
  timezone,
  ventanaDias,
  fecha,
  onElegir,
  libres,
  onVerMas,
}: {
  timezone: string;
  ventanaDias: number;
  fecha: string | null;
  onElegir: (fecha: string) => void;
  /** Horarios libres por día. Un día con 0 se muestra sin lugar y no se puede elegir; uno que no está, todavía no se sabe. */
  libres?: Record<string, number>;
  onVerMas?: () => void;
}) {
  const [verMas, setVerMas] = useState(false);
  const dias = useMemo(
    () =>
      listarDias(timezone, verMas ? ventanaDias + 1 : Math.min(DIAS_INICIALES, ventanaDias + 1)),
    [timezone, ventanaDias, verMas],
  );

  return (
    <>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-7">
        {dias.map((d) => {
          const cantidad = libres?.[d.fecha];
          const sinLugar = cantidad === 0;
          const elegido = fecha === d.fecha;
          return (
            <button
              key={d.fecha}
              type="button"
              onClick={() => onElegir(d.fecha)}
              disabled={sinLugar}
              aria-pressed={elegido}
              aria-label={`${d.diaSemana} ${d.numero} de ${d.mes}${sinLugar ? ", sin lugar" : ""}`}
              className={`relative flex flex-col items-center rounded-2xl border py-3 transition ${
                elegido
                  ? "border-(--n-acento) bg-(--n-acento) text-(--n-acento-tinta)"
                  : sinLugar
                    ? "cursor-not-allowed border-transparent bg-(--n-texto)/[0.03] text-(--n-texto)/30"
                    : "border-(--n-texto)/10 bg-(--n-tarjeta) hover:-translate-y-0.5 hover:border-(--n-acento)/60"
              }`}
            >
              <span className="text-[11px] uppercase opacity-70">{d.diaSemana}</span>
              <span className={`text-lg font-extrabold ${sinLugar ? "line-through" : ""}`}>
                {d.numero}
              </span>
              <span className="text-[11px] uppercase opacity-70">{sinLugar ? "sin lugar" : d.mes}</span>
              {cantidad !== undefined && cantidad > 0 && !elegido && (
                <span
                  aria-hidden="true"
                  className="absolute top-2 right-2 size-1.5 rounded-full bg-(--n-acento)"
                />
              )}
            </button>
          );
        })}
      </div>
      {!verMas && ventanaDias + 1 > DIAS_INICIALES && (
        <button
          type="button"
          onClick={() => {
            setVerMas(true);
            onVerMas?.();
          }}
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

  if (cargando) {
    return (
      <div className="mt-6" aria-busy="true">
        <p className="sr-only">Buscando horarios libres…</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} className="h-12 animate-pulse rounded-xl bg-(--n-texto)/[0.06]" />
          ))}
        </div>
      </div>
    );
  }

  if (franjas.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-(--n-texto)/10 bg-(--n-tarjeta) p-6">
        <p className="font-semibold">No quedan horarios libres ese día.</p>
        <p className="mt-1 text-sm text-(--n-texto)/60">Probá con otra fecha.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      {franjas.map((f) => (
        <div key={f.nombre}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-(--n-texto)/50">
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
                    : "border-(--n-texto)/10 bg-(--n-tarjeta) hover:border-(--n-texto)/30"
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
