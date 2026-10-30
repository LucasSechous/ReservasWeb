import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MAX_REPROGRAMACIONES, type ReservaGestion, hashToken, tokenValido } from "@/lib/gestion";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPublicClient } from "@/lib/supabase/server";
import { getTema, temaStyle } from "@/lib/tema";
import { capitalizar, vocabularioDe } from "@/lib/vocabulario";
import { GestionReserva } from "./gestion-reserva";

// El link va por mail y es una llave: no se indexa y no se manda como referrer a otros sitios.
export const metadata: Metadata = {
  title: "Tu turno",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function Reserva({ params }: PageProps<"/reserva/[token]">) {
  return (
    <Suspense
      fallback={<div className="grid min-h-screen place-items-center text-(--n-texto)/50">Cargando…</div>}
    >
      <Contenido params={params} />
    </Suspense>
  );
}

async function Contenido({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  // Token con forma inválida o desconocido: el mismo 404, sin revelar si la reserva existió.
  if (!tokenValido(token)) notFound();

  const { data } = await createAdminClient().rpc("gestion_obtener_reserva", {
    p_token_hash: hashToken(token),
    p_max_reprogramaciones: MAX_REPROGRAMACIONES,
  });
  const reserva = (data as ReservaGestion[] | null)?.[0];
  if (!reserva) notFound();

  return (
    <div
      style={temaStyle(getTema(reserva.negocio_slug))}
      className="min-h-screen bg-(--n-fondo) text-(--n-texto) selection:bg-(--n-acento) selection:text-(--n-acento-tinta)"
    >
      <div className="mx-auto max-w-lg px-5 py-10 sm:py-12">
        <GestionReserva
          token={token}
          inicial={reserva}
          ventanaDias={await ventanaDiasDe(reserva.negocio_id)}
          maxReprogramaciones={MAX_REPROGRAMACIONES}
          etiquetaServicio={capitalizar(vocabularioDe(getTema(reserva.negocio_slug).rubro).servicio)}
        />
      </div>
    </div>
  );
}

async function ventanaDiasDe(negocioId: string): Promise<number> {
  const { data } = await createPublicClient()
    .from("negocios")
    .select("ventana_dias")
    .eq("id", negocioId)
    .maybeSingle();
  return data?.ventana_dias ?? 30;
}
