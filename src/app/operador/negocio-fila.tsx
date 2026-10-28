"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cambiarActivo } from "./actions";

export type NegocioListado = {
  id: string;
  slug: string;
  nombre: string;
  activo: boolean;
  email: string | null;
};

export function NegocioFila({ negocio }: { negocio: NegocioListado }) {
  const router = useRouter();
  const [trabajando, setTrabajando] = useState(false);

  async function alternar() {
    const mensaje = negocio.activo
      ? `¿Desactivar «${negocio.nombre}»? Su web deja de mostrarse y no se pueden hacer reservas.`
      : `¿Volver a activar «${negocio.nombre}»?`;
    if (!window.confirm(mensaje)) return;
    setTrabajando(true);
    await cambiarActivo(negocio.id, !negocio.activo);
    setTrabajando(false);
    router.refresh();
  }

  const enlace = "font-semibold text-accent underline";

  return (
    <li className="rounded-2xl border border-white/10 bg-ink-2 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-lg font-bold">
            {negocio.nombre}
            {!negocio.activo && (
              <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-white/60">
                Inactivo
              </span>
            )}
          </p>
          <p className="text-sm text-white/50">
            /{negocio.slug}
            {negocio.email ? ` · ${negocio.email}` : ""}
          </p>
          <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <Link href={`/${negocio.slug}`} className={enlace}>
              Landing
            </Link>
            <Link href={`/${negocio.slug}/reservar`} className={enlace}>
              Reservar
            </Link>
            <Link href={`/panel?negocio=${negocio.slug}`} className={enlace}>
              Agenda
            </Link>
          </p>
        </div>
        <button
          type="button"
          onClick={alternar}
          disabled={trabajando}
          className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold hover:border-white/50 disabled:opacity-40"
        >
          {negocio.activo ? "Desactivar" : "Activar"}
        </button>
      </div>
    </li>
  );
}
