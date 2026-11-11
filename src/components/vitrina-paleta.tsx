"use client";

import { type ReactNode, useState, useSyncExternalStore } from "react";

// Paletas de prueba para la vitrina. Cada una redefine las variables de color (globals.css, [data-paleta])
// solo dentro de la vitrina: las landings de los negocios no se enteran. El selector flotante aparece
// fuera de producción, para comparar en el preview; la elegida se recuerda en el navegador y también
// se puede pasar por link (?paleta=oceano) para mostrársela a alguien.
export const PALETAS = [
  { id: "menta", nombre: "Menta nocturna", tipo: "Oscura", fondo: "#0c1626", acento: "#3ddc97", idea: "La actual. Verde menta: éxito, «listo, reservado»." },
  { id: "oceano", nombre: "Océano", tipo: "Oscura", fondo: "#0b1324", acento: "#5b9dff", idea: "Azul: confianza y seriedad, como un banco o una app de salud." },
  { id: "laguna", nombre: "Laguna", tipo: "Oscura", fondo: "#0a1a1c", acento: "#2dd4bf", idea: "Verde agua: calma y frescura, ideal para estética y bienestar." },
  { id: "nube", nombre: "Nube", tipo: "Clara", fondo: "#f6f8fc", acento: "#2563eb", idea: "Blanco y azul: limpio, profesional, de software confiable." },
  { id: "salvia", nombre: "Salvia", tipo: "Clara", fondo: "#f4f7f2", acento: "#16794a", idea: "Verde natural: crecimiento y tranquilidad, cálido sin ser infantil." },
  { id: "brisa", nombre: "Brisa", tipo: "Clara", fondo: "#f3f8f8", acento: "#0e7c86", idea: "Petróleo sobre blanco: entre azul y verde, sereno y prolijo." },
] as const;

type IdPaleta = (typeof PALETAS)[number]["id"];
const CLAVE = "tuturno:paleta";
const EVENTO = "tuturno:paleta";

function esPaleta(valor: string | null): valor is IdPaleta {
  return PALETAS.some((p) => p.id === valor);
}

function leer(): IdPaleta {
  const deLink = new URLSearchParams(window.location.search).get("paleta");
  if (esPaleta(deLink)) return deLink;
  try {
    const guardada = window.localStorage.getItem(CLAVE);
    if (esPaleta(guardada)) return guardada;
  } catch {
    // Sin almacenamiento: queda la de siempre.
  }
  return "menta";
}

function suscribir(avisar: () => void) {
  window.addEventListener(EVENTO, avisar);
  return () => window.removeEventListener(EVENTO, avisar);
}

function elegir(id: IdPaleta) {
  try {
    window.localStorage.setItem(CLAVE, id);
  } catch {
    // Sin almacenamiento: dura hasta recargar.
  }
  const url = new URL(window.location.href);
  url.searchParams.set("paleta", id);
  window.history.replaceState(null, "", url);
  window.dispatchEvent(new Event(EVENTO));
}

export function VitrinaPaleta({
  children,
  selector,
}: {
  children: ReactNode;
  /** Muestra el selector flotante (fuera de producción). */
  selector: boolean;
}) {
  const paleta = useSyncExternalStore(suscribir, leer, () => "menta" as IdPaleta);
  const [abierto, setAbierto] = useState(false);
  const actual = PALETAS.find((p) => p.id === paleta) ?? PALETAS[0];

  return (
    <div data-paleta={paleta} className="flex min-h-screen flex-col">
      {children}
      {selector && (
        <div className="fixed bottom-20 left-4 z-[60] max-w-[calc(100vw-2rem)] font-sans">
          {abierto ? (
            <div className="w-72 rounded-2xl border border-black/10 bg-[#fff] p-3 text-[#111827] shadow-2xl">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-[#6b7280]">
                  Probar paleta
                </p>
                <button
                  type="button"
                  onClick={() => setAbierto(false)}
                  className="rounded px-1.5 text-sm text-[#6b7280] hover:bg-black/5"
                  aria-label="Cerrar el selector de paletas"
                >
                  ✕
                </button>
              </div>
              <ul className="mt-2 grid grid-cols-3 gap-2">
                {PALETAS.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => elegir(p.id)}
                      aria-pressed={p.id === paleta}
                      className={`w-full rounded-xl border p-1.5 text-left transition ${
                        p.id === paleta ? "border-[#111827] ring-2 ring-[#111827]/15" : "border-black/10 hover:border-black/30"
                      }`}
                    >
                      <span
                        className="flex h-8 items-center justify-center rounded-lg"
                        style={{ backgroundColor: p.fondo }}
                      >
                        <span className="h-3 w-8 rounded-full" style={{ backgroundColor: p.acento }} />
                      </span>
                      <span className="mt-1 block truncate text-[11px] font-semibold">{p.nombre}</span>
                      <span className="block text-[10px] text-[#6b7280]">{p.tipo}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs leading-snug text-[#4b5563]">{actual.idea}</p>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAbierto(true)}
              className="flex items-center gap-2 rounded-full border border-black/10 bg-[#fff] px-3 py-2 text-xs font-bold text-[#111827] shadow-xl"
            >
              <span className="size-3 rounded-full" style={{ backgroundColor: actual.acento }} />
              Paleta: {actual.nombre}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
