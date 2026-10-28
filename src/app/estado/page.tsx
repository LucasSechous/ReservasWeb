import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
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
    return <p className="text-red-700">No se pudo leer de Supabase: {error}</p>;
  }
  return (
    <p className="text-emerald-700">
      Conectado a Supabase. Negocios activos: {total}
    </p>
  );
}

export default function Estado() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-4">
      <h1 className="text-2xl font-bold">Estado</h1>
      <Suspense fallback={<p className="text-foreground/60">Conectando…</p>}>
        <EstadoSupabase />
      </Suspense>
    </main>
  );
}
