"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

// En el celular, deslizar el dedo a los costados cambia de día (o de semana) en la agenda.
// Solo cuenta un gesto claramente horizontal, para no molestar al bajar por la lista.
const MINIMO = 70;

export function Deslizar({
  anterior,
  siguiente,
  children,
}: {
  anterior: string;
  siguiente: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const inicio = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    router.prefetch(anterior);
    router.prefetch(siguiente);
  }, [router, anterior, siguiente]);

  return (
    <div
      onTouchStart={(e) => {
        const t = e.touches[0];
        // Los gestos que arrancan en un campo o botón son del campo, no de la agenda.
        const objetivo = e.target as HTMLElement;
        inicio.current = objetivo.closest("input, select, textarea, form")
          ? null
          : { x: t.clientX, y: t.clientY };
      }}
      onTouchEnd={(e) => {
        const desde = inicio.current;
        inicio.current = null;
        if (!desde) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - desde.x;
        const dy = t.clientY - desde.y;
        if (Math.abs(dx) < MINIMO || Math.abs(dx) < Math.abs(dy) * 2) return;
        router.push(dx < 0 ? siguiente : anterior, { scroll: false });
      }}
    >
      {children}
    </div>
  );
}
