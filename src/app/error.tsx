"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Logo } from "@/components/logo";

// Lo que ve un cliente si algo falla en el servidor, en vez de la pantalla genérica en inglés.
export default function ErrorPagina({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-12">
      <Link href="/" aria-label="Tu Turno, ir al inicio">
        <Logo />
      </Link>
      <h1 className="mt-8 font-display text-3xl font-extrabold">Algo no cargó bien</h1>
      <p className="mt-3 text-white/65">
        Fue un problema nuestro, no tuyo. Probá de nuevo en un momento; si estabas reservando, tu
        turno no quedó a medias.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="inline-flex min-h-12 items-center rounded-full bg-accent px-6 font-bold text-accent-ink transition hover:brightness-110"
        >
          Probar de nuevo
        </button>
        <Link
          href="/"
          className="inline-flex min-h-12 items-center rounded-full border border-white/20 px-6 font-semibold transition-colors hover:border-accent hover:text-accent"
        >
          Ir al inicio
        </Link>
      </div>
    </main>
  );
}
