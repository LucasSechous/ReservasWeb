import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  ahoraMs,
  formatoFechaLarga,
  hoyEn,
  instanteLocal,
  parseRango,
  sumarDias,
} from "@/lib/fechas";
import { cargarContexto } from "./contexto";
import { ReservaItem } from "./reserva-item";
import { PanelShell, SinAcceso } from "./shell";
import { aItem, COLUMNAS_TURNO, cuentanComoTurno, type FilaTurno } from "./turnos";

export const metadata: Metadata = {
  title: "Hoy",
  robots: { index: false, follow: false },
};

export default function Hoy({ searchParams }: PageProps<"/panel">) {
  return (
    <Suspense fallback={<p className="p-8 text-white/50">Cargando tu agenda…</p>}>
      <Contenido searchParams={searchParams} />
    </Suspense>
  );
}

function enCuanto(minutos: number): string {
  if (minutos <= 0) return "Ahora";
  if (minutos < 60) return `En ${minutos} min`;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m === 0 ? `En ${h} h` : `En ${h} h ${m} min`;
}

function Dato({ valor, etiqueta, marca }: { valor: number; etiqueta: string; marca?: string }) {
  return (
    <div className="rounded-2xl border border-(--n-texto)/10 bg-(--n-tarjeta) px-4 py-3">
      <p className={`font-display text-3xl font-extrabold ${marca ?? ""}`}>{valor}</p>
      <p className="text-xs font-semibold uppercase tracking-wider text-(--n-texto)/55">
        {etiqueta}
      </p>
    </div>
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
  const tz = negocio.timezone;

  const ahora = ahoraMs();
  const hoy = hoyEn(tz);
  const inicioHoy = instanteLocal(hoy, "00:00", tz);
  const inicioManana = instanteLocal(sumarDias(hoy, 1), "00:00", tz);
  const hace14 = instanteLocal(sumarDias(hoy, -14), "00:00", tz);

  const [{ data: deHoy }, { data: sinMarcarFilas }] = await Promise.all([
    supabase
      .from("reservas")
      .select(COLUMNAS_TURNO)
      .eq("negocio_id", negocio.id)
      .in("estado", ["confirmada", "cancelada", "completada", "no_show"])
      .overlaps("rango", `[${inicioHoy},${inicioManana})`),
    // Turnos de los últimos 14 días que nadie marcó: de ahí salen las estadísticas de asistencia.
    supabase
      .from("reservas")
      .select(COLUMNAS_TURNO)
      .eq("negocio_id", negocio.id)
      .eq("estado", "confirmada")
      .neq("origen", "bloqueo")
      .overlaps("rango", `[${hace14},${inicioHoy})`),
  ]);

  const items = ((deHoy ?? []) as FilaTurno[])
    .map((f) => aItem(f, tz, ahora))
    .filter((i) => i !== null)
    .sort((a, b) => a.orden.localeCompare(b.orden));
  const sinMarcar = ((sinMarcarFilas ?? []) as FilaTurno[])
    .map((f) => aItem(f, tz, ahora, true))
    .filter((i) => i !== null)
    .sort((a, b) => b.orden.localeCompare(a.orden));

  const turnos = items.filter(cuentanComoTurno);
  const proximo = ((deHoy ?? []) as FilaTurno[])
    .filter((f) => f.estado === "confirmada" && f.origen !== "bloqueo")
    .map((f) => ({ f, ...parseRango(f.rango) }))
    .filter((t) => new Date(t.fin).getTime() > ahora)
    .sort((a, b) => a.inicio.localeCompare(b.inicio))[0];
  const itemProximo = proximo ? items.find((i) => i.id === proximo.f.id) : undefined;

  const vinieron = items.filter((i) => i.estado === "completada").length;
  const faltan = turnos.filter((i) => i.estado === "confirmada" && !i.empezo).length;

  return (
    <PanelShell ctx={ctx} activa="hoy">
      <p className="text-sm font-semibold capitalize text-(--n-texto)/60">
        {formatoFechaLarga(hoy)}
      </p>

      {itemProximo && proximo ? (
        <section
          aria-label="Próximo turno"
          className="mt-3 rounded-3xl border border-(--n-acento)/40 bg-gradient-to-br from-(--n-acento)/15 to-(--n-tarjeta) p-5 sm:p-6"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-(--n-acento)">
            Próximo turno ·{" "}
            {enCuanto(Math.round((new Date(proximo.inicio).getTime() - ahora) / 60000))}
          </p>
          <p className="mt-2 font-display text-4xl font-extrabold">
            {itemProximo.horario.split(" – ")[0]}
          </p>
          <p className="mt-1 text-xl font-bold">{itemProximo.cliente}</p>
          <p className="text-(--n-texto)/70">
            {itemProximo.servicio} · con {itemProximo.profesional}
          </p>
        </section>
      ) : (
        <section className="mt-3 rounded-3xl border border-(--n-texto)/10 bg-(--n-tarjeta) p-5 sm:p-6">
          <p className="font-display text-2xl font-extrabold">
            {turnos.length === 0 ? "Hoy no tenés turnos" : "No quedan más turnos por hoy"}
          </p>
          <p className="mt-1 text-(--n-texto)/65">
            {turnos.length === 0
              ? "Si alguien te escribe para reservar, cargalo a mano en un momento."
              : "Buen trabajo. Repasá abajo cómo salió el día."}
          </p>
          <Link
            href={enlace("/panel/nuevo")}
            className="mt-4 inline-flex min-h-11 items-center rounded-full bg-(--n-acento) px-5 text-sm font-bold text-(--n-acento-tinta) hover:brightness-110"
          >
            + Agendar un turno
          </Link>
        </section>
      )}

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Dato valor={turnos.length} etiqueta="Turnos hoy" />
        <Dato valor={faltan} etiqueta="Todavía faltan" />
        <Dato valor={vinieron} etiqueta="Vinieron" marca="text-(--n-acento)" />
      </div>

      {sinMarcar.length > 0 && (
        <section className="mt-8" aria-label="Turnos sin marcar">
          <h2 className="font-display text-xl font-bold text-amber-300">
            Falta marcar ({sinMarcar.length})
          </h2>
          <p className="mt-1 text-sm text-(--n-texto)/65">
            Contanos si vinieron. Así tus estadísticas son reales.
          </p>
          <ul className="mt-3 space-y-3">
            {sinMarcar.map((item) => (
              <ReservaItem key={item.id} item={item} />
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8" aria-label="Turnos de hoy">
        <h2 className="font-display text-xl font-bold">Hoy</h2>
        {items.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-(--n-texto)/10 bg-(--n-tarjeta) p-5 text-(--n-texto)/65">
            Sin turnos este día.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {items.map((item) => (
              <ReservaItem key={item.id} item={item} />
            ))}
          </ul>
        )}
      </section>
    </PanelShell>
  );
}
