import type { Metadata } from "next";
import { Suspense } from "react";
import { cargarContexto } from "../contexto";
import { PanelShell, SinAcceso } from "../shell";
import { NuevoTurno } from "./nuevo-turno";

export const metadata: Metadata = {
  title: "Agendar un turno",
  robots: { index: false, follow: false },
};

export default function Nuevo({ searchParams }: PageProps<"/panel/nuevo">) {
  return (
    <Suspense fallback={<p className="p-8 text-white/50">Cargando…</p>}>
      <Contenido searchParams={searchParams} />
    </Suspense>
  );
}

async function Contenido({
  searchParams,
}: {
  searchParams: Promise<{ [clave: string]: string | string[] | undefined }>;
}) {
  const r = await cargarContexto(await searchParams);
  if (!r.ok) return <SinAcceso email={r.email} />;
  const { ctx } = r;
  const { supabase, negocio, enlace } = ctx;

  const [{ data: negocioFila }, { data: servicios }, { data: profesionales }, { data: vinculos }] =
    await Promise.all([
      supabase.from("negocios").select("ventana_dias").eq("id", negocio.id).maybeSingle(),
      supabase
        .from("servicios")
        .select("id, nombre, duracion_minutos, precio")
        .eq("negocio_id", negocio.id)
        .eq("activo", true)
        .order("created_at", { ascending: true }),
      supabase
        .from("profesionales")
        .select("id, nombre")
        .eq("negocio_id", negocio.id)
        .eq("activo", true)
        .order("created_at", { ascending: true }),
      supabase.from("profesional_servicios").select("profesional_id, servicio_id"),
    ]);

  return (
    <PanelShell ctx={ctx} activa="nuevo">
      <h2 className="font-display text-3xl font-extrabold">Agendar un turno</h2>
      <p className="mt-1 text-(--n-texto)/65">
        Para cuando un cliente te escribe o te llama. Elegí el servicio, el día y la hora, y anotá
        el nombre.
      </p>
      <div className="mt-6">
        <NuevoTurno
          negocioId={negocio.id}
          timezone={negocio.timezone}
          ventanaDias={negocioFila?.ventana_dias ?? 30}
          servicios={servicios ?? []}
          profesionales={profesionales ?? []}
          vinculos={vinculos ?? []}
          rutaAgenda={enlace("/panel/agenda")}
          rutaHoy={enlace("/panel")}
        />
      </div>
    </PanelShell>
  );
}
