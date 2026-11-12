import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { Logo } from "@/components/logo";
import { createPublicClient } from "@/lib/supabase/server";

// Página técnica para comprobar la conexión con Supabase. No se indexa ni se enlaza.
export const metadata: Metadata = {
  title: "Estado",
  robots: { index: false, follow: false },
};

async function contarNegocios(): Promise<{ total?: number; error?: string }> {
  try {
    const supabase = createPublicClient();
    const { count, error } = await supabase
      .from("negocios")
      .select("id", { count: "exact", head: true });

    if (error) return { error: error.message };
    return { total: count ?? 0 };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "error desconocido" };
  }
}

async function EstadoSupabase() {
  await connection(); // se consulta en cada visita, nunca en el build
  const { total, error } = await contarNegocios();

  if (error) {
    return (
      <Fila color="bg-red-400" titulo="Base de datos: sin conexión" detalle={`No se pudo leer de Supabase: ${error}`} />
    );
  }
  return (
    <Fila
      color="bg-accent"
      titulo="Base de datos: funcionando"
      detalle={`Conectado a Supabase. Negocios activos: ${total}`}
    />
  );
}

function Fila({ color, titulo, detalle }: { color: string; titulo: string; detalle: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="relative mt-1.5 flex size-3 shrink-0">
        <span className={`absolute inset-0 animate-ping rounded-full opacity-50 motion-reduce:animate-none ${color}`} />
        <span className={`relative size-3 rounded-full ${color}`} />
      </span>
      <div>
        <p className="font-semibold">{titulo}</p>
        <p className="text-sm text-white/60">{detalle}</p>
      </div>
    </div>
  );
}

export default function Estado() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5">
      <Logo />
      <h1 className="mt-8 font-display text-3xl font-extrabold">Estado del sistema</h1>
      <div className="mt-6 rounded-3xl border border-white/10 bg-ink-2 p-5">
        <Suspense
          fallback={<Fila color="bg-white/30" titulo="Base de datos" detalle="Conectando…" />}
        >
          <EstadoSupabase />
        </Suspense>
      </div>
    </main>
  );
}
