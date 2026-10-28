import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { formatoInstanteLargo } from "@/lib/fechas";
import { createPublicClient } from "@/lib/supabase/server";
import { getTema, temaStyle } from "@/lib/tema";
import { CancelarForm } from "./cancelar-form";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// El link de cancelación va por mail: no debe indexarse.
export const metadata: Metadata = {
  title: "Cancelar turno",
  robots: { index: false, follow: false },
};

export default function Cancelar({ params }: PageProps<"/cancelar/[token]">) {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center text-white/50">Cargando…</div>
      }
    >
      <Contenido params={params} />
    </Suspense>
  );
}

async function Contenido({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!UUID.test(token)) notFound();

  const { data } = await createPublicClient().rpc("reserva_por_token", { p_token: token });
  const reserva = data?.[0];
  if (!reserva) notFound();

  const cuando = formatoInstanteLargo(reserva.inicio, reserva.timezone);
  const aviso =
    reserva.estado === "cancelada"
      ? "Este turno ya fue cancelado."
      : !reserva.puede_cancelar
        ? "Este turno ya pasó y no se puede cancelar."
        : null;

  return (
    <div
      style={temaStyle(getTema(reserva.negocio_slug))}
      className="min-h-screen bg-(--n-fondo) text-(--n-texto) selection:bg-(--n-acento) selection:text-(--n-acento-tinta)"
    >
      <div className="mx-auto max-w-lg px-5 py-12">
        <Link
          href={`/${reserva.negocio_slug}`}
          className="text-sm font-semibold text-white/60 hover:text-white"
        >
          ← {reserva.negocio_nombre}
        </Link>
        <h1 className="mt-6 text-3xl font-extrabold">Cancelar turno</h1>

        <dl className="mt-6 space-y-2 rounded-2xl border border-white/10 bg-(--n-tarjeta) p-5 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-white/55">Servicio</dt>
            <dd className="font-semibold">{reserva.servicio_nombre ?? "Turno"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-white/55">Cuándo</dt>
            <dd className="text-right font-semibold capitalize">{cuando}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-white/55">Con</dt>
            <dd className="font-semibold">{reserva.profesional_nombre}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-white/55">A nombre de</dt>
            <dd className="font-semibold">{reserva.cliente_nombre}</dd>
          </div>
        </dl>

        <div className="mt-8">
          {aviso ? (
            <p className="rounded-2xl border border-white/10 bg-(--n-tarjeta) p-5">{aviso}</p>
          ) : (
            <>
              <p className="mb-4 text-white/70">
                ¿Querés cancelar este turno? El horario va a quedar libre para otra persona.
              </p>
              <CancelarForm token={token} slug={reserva.negocio_slug} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
