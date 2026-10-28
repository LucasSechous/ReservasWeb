import { Suspense } from "react";
import { connection } from "next/server";
import { createPublicClient } from "@/lib/supabase/server";

// Fase 0: comprueba que la web se conecta a Supabase y que RLS deja leer lo público.
// Se reemplaza en la Fase 1 por la vitrina.
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

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-4">
      <h1 className="text-3xl font-bold">ReservasWeb</h1>
      <p className="text-zinc-600">Páginas web con reservas para tu negocio.</p>
      <Suspense fallback={<p className="text-zinc-500">Conectando…</p>}>
        <EstadoSupabase />
      </Suspense>
    </main>
  );
}
