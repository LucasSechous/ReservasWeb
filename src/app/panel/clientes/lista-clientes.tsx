"use client";

import { useMemo, useState } from "react";

export type ClienteFicha = {
  clave: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  vino: number;
  falto: number;
  canceladas: number;
  pendientes: number;
  ultimaVez: string | null;
  historial: { inicio: string; cuando: string; servicio: string; estado: string }[];
};

const ESTADOS: Record<string, string> = {
  completada: "✓ Vino",
  no_show: "✗ No vino",
  cancelada: "Cancelado",
  confirmada: "Agendado",
};

function digitosWhatsapp(telefono: string): string {
  const d = telefono.replace(/\D/g, "");
  return telefono.trim().startsWith("+") || d.startsWith("598") ? d : `598${d.replace(/^0/, "")}`;
}

function sinAcentos(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function ListaClientes({ clientes, umbral }: { clientes: ClienteFicha[]; umbral: number }) {
  const [busqueda, setBusqueda] = useState("");
  const [abierto, setAbierto] = useState<string | null>(null);

  const visibles = useMemo(() => {
    const q = sinAcentos(busqueda.trim());
    if (!q) return clientes;
    return clientes.filter((c) =>
      sinAcentos(`${c.nombre} ${c.telefono ?? ""} ${c.email ?? ""}`).includes(q),
    );
  }, [clientes, busqueda]);

  if (clientes.length === 0) {
    return (
      <p className="rounded-3xl border border-(--n-texto)/10 bg-(--n-tarjeta) p-6 text-(--n-texto)/65">
        Todavía no hay clientes. Aparecen solos a medida que reservan.
      </p>
    );
  }

  return (
    <>
      <label className="block">
        <span className="sr-only">Buscar un cliente</span>
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          type="search"
          placeholder="Buscar por nombre, teléfono o mail"
          className="w-full rounded-2xl border border-(--n-texto)/15 bg-(--n-tarjeta) px-4 py-3 outline-none placeholder:text-(--n-texto)/40 focus:border-(--n-acento)"
        />
      </label>
      <p className="mt-3 text-sm text-(--n-texto)/55">
        {visibles.length} {visibles.length === 1 ? "cliente" : "clientes"}
      </p>

      <ul className="mt-3 space-y-3">
        {visibles.map((c) => {
          const suele = c.falto >= umbral;
          const abierta = abierto === c.clave;
          return (
            <li
              key={c.clave}
              className={`rounded-3xl border bg-(--n-tarjeta) ${
                suele ? "border-amber-300/50" : "border-(--n-texto)/10"
              }`}
            >
              <button
                type="button"
                onClick={() => setAbierto(abierta ? null : c.clave)}
                aria-expanded={abierta}
                className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2 p-4 text-left sm:p-5"
              >
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold">{c.nombre}</p>
                  <p className="text-sm text-(--n-texto)/55">
                    {c.ultimaVez ? `Última vez: ${c.ultimaVez}` : "Sin turnos"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
                  <span className="rounded-full bg-(--n-acento)/15 px-3 py-1 text-(--n-acento)">
                    ✓ {c.vino}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 ${
                      c.falto > 0
                        ? "bg-amber-400/15 text-amber-300"
                        : "bg-(--n-texto)/10 text-(--n-texto)/50"
                    }`}
                  >
                    ✗ {c.falto}
                  </span>
                </div>
              </button>

              {suele && (
                <p className="mx-4 mb-3 rounded-xl bg-amber-400/10 px-3 py-2 text-sm font-semibold text-amber-200 sm:mx-5">
                  Suele no presentarse: faltó {c.falto} veces.
                </p>
              )}

              {abierta && (
                <div className="border-t border-(--n-texto)/10 p-4 sm:p-5">
                  {(c.telefono || c.email) && (
                    <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      {c.telefono && (
                        <>
                          <a href={`tel:${c.telefono}`} className="underline">
                            {c.telefono}
                          </a>
                          <a
                            href={`https://wa.me/${digitosWhatsapp(c.telefono)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-(--n-acento) underline"
                          >
                            WhatsApp
                          </a>
                        </>
                      )}
                      {c.email && <span className="text-(--n-texto)/60">{c.email}</span>}
                    </p>
                  )}
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-(--n-texto)/50">
                    Historial
                  </p>
                  <ul className="mt-2 divide-y divide-(--n-texto)/10 text-sm">
                    {c.historial.map((h) => (
                      <li
                        key={`${h.inicio}-${h.servicio}`}
                        className="flex justify-between gap-3 py-2"
                      >
                        <span className="min-w-0">
                          <span className="block capitalize">{h.cuando}</span>
                          <span className="text-(--n-texto)/55">{h.servicio}</span>
                        </span>
                        <span className="flex-none font-semibold">
                          {ESTADOS[h.estado] ?? h.estado}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
