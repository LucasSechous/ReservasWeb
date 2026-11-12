import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EsqueletoPanel } from "@/components/esqueleto-panel";
import {
  ahoraMs,
  formatoFechaLarga,
  formatoHora,
  hoyEn,
  instanteLocal,
  sumarDias,
} from "@/lib/fechas";
import { BloquearForm } from "../bloquear-form";
import { cargarContexto, texto } from "../contexto";
import { Deslizar } from "../deslizar";
import { ListaDelDia } from "../lista-dia";
import { PanelShell, SinAcceso } from "../shell";
import { TiraSemana } from "./tira-semana";
import {
  aItem,
  COLUMNAS_TURNO,
  cuentanComoTurno,
  type FilaTurno,
  type ItemOrdenado,
} from "../turnos";

export const metadata: Metadata = {
  title: "Agenda",
  robots: { index: false, follow: false },
};

export default function Agenda({ searchParams }: PageProps<"/panel/agenda">) {
  return (
    <Suspense fallback={<EsqueletoPanel />}>
      <Contenido searchParams={searchParams} />
    </Suspense>
  );
}

function lunesDe(fecha: string): string {
  const [a, m, d] = fecha.split("-").map(Number);
  const diaSemana = new Date(Date.UTC(a, m - 1, d)).getUTCDay(); // 0 = domingo
  return sumarDias(fecha, -((diaSemana + 6) % 7));
}

async function Contenido({
  searchParams,
}: {
  searchParams: Promise<{ [clave: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const r = await cargarContexto(params);
  if (!r.ok) return <SinAcceso email={r.email} />;
  const { ctx } = r;
  const { supabase, negocio, enlace } = ctx;
  const tz = negocio.timezone;

  const ahora = ahoraMs();
  const hoy = hoyEn(tz);
  const fechaPedida = texto(params.fecha);
  const fecha = fechaPedida && /^\d{4}-\d{2}-\d{2}$/.test(fechaPedida) ? fechaPedida : hoy;
  const vista = texto(params.vista) === "semana" ? "semana" : "dia";

  // Siempre se trae la semana entera: en la vista de día alimenta la tira con los turnos de cada día.
  const desde = lunesDe(fecha);
  const hasta = sumarDias(desde, 6);
  const salto = vista === "semana" ? 7 : 1;

  const ir = (cambios: { fecha?: string; vista?: string }) =>
    enlace("/panel/agenda", {
      vista: cambios.vista ?? vista,
      fecha: cambios.fecha ?? fecha,
    });

  const [{ data: filas }, { data: profesionales }] = await Promise.all([
    supabase
      .from("reservas")
      .select(COLUMNAS_TURNO)
      .in("estado", ["confirmada", "cancelada", "completada", "no_show"])
      .eq("negocio_id", negocio.id)
      .overlaps(
        "rango",
        `[${instanteLocal(desde, "00:00", tz)},${instanteLocal(sumarDias(hasta, 1), "00:00", tz)})`,
      ),
    supabase
      .from("profesionales")
      .select("id, nombre")
      .eq("negocio_id", negocio.id)
      .eq("activo", true)
      .order("created_at", { ascending: true }),
  ]);

  // Se agrupa por día (en hora del negocio) y se ordena por hora de inicio.
  const porDia = new Map<string, ItemOrdenado[]>();
  for (const f of (filas ?? []) as FilaTurno[]) {
    const item = aItem(f, tz, ahora);
    if (!item) continue;
    const lista = porDia.get(item.dia) ?? [];
    lista.push(item);
    porDia.set(item.dia, lista);
  }

  const dias: string[] = [];
  for (let d = desde; d <= hasta; d = sumarDias(d, 1)) dias.push(d);
  const visibles = vista === "semana" ? dias.filter((d) => porDia.has(d)) : [fecha];
  const cuantos = (dia: string) => (porDia.get(dia) ?? []).filter(cuentanComoTurno).length;
  const total = visibles.reduce((n, d) => n + cuantos(d), 0);
  const horaAhora = formatoHora(new Date(ahora).toISOString(), tz);

  const pestana = (activa: boolean) =>
    `rounded-full px-4 py-2 text-sm font-semibold ${
      activa
        ? "bg-(--n-acento) text-(--n-acento-tinta)"
        : "border border-(--n-texto)/20 hover:border-(--n-texto)/50"
    }`;
  const flecha =
    "rounded-full border border-(--n-texto)/20 px-4 py-2 text-sm font-semibold hover:border-(--n-texto)/50";

  return (
    <PanelShell ctx={ctx} activa="agenda">
      <nav className="flex flex-wrap items-center gap-2" aria-label="Vista de la agenda">
        <Link href={ir({ vista: "dia" })} className={pestana(vista === "dia")}>
          Día
        </Link>
        <Link href={ir({ vista: "semana" })} className={pestana(vista === "semana")}>
          Semana
        </Link>
        <span className="mx-1 hidden h-6 w-px bg-(--n-texto)/15 sm:block" />
        <Link
          href={ir({ fecha: sumarDias(fecha, -salto) })}
          aria-label="Anterior"
          className={flecha}
        >
          ←
        </Link>
        <Link href={ir({ fecha: hoy })} className={pestana(false)}>
          Hoy
        </Link>
        <Link
          href={ir({ fecha: sumarDias(fecha, salto) })}
          aria-label="Siguiente"
          className={flecha}
        >
          →
        </Link>
      </nav>

      <TiraSemana
        dias={dias.map((dia) => ({ fecha: dia, turnos: cuantos(dia), href: ir({ vista: "dia", fecha: dia }) }))}
        elegido={vista === "dia" ? fecha : undefined}
        hoy={hoy}
      />

      <p className="mt-5 capitalize text-(--n-texto)/70">
        {vista === "semana"
          ? `Semana del ${formatoFechaLarga(desde)} al ${formatoFechaLarga(hasta)}`
          : formatoFechaLarga(fecha)}
        {" · "}
        <span className="font-semibold text-(--n-texto)">
          {total} {total === 1 ? "turno" : "turnos"}
        </span>
      </p>

      <div className="mt-5">
        <BloquearForm
          negocioId={negocio.id}
          fechaInicial={fecha}
          profesionales={profesionales ?? []}
        />
      </div>

      <Deslizar
        anterior={ir({ fecha: sumarDias(fecha, -salto) })}
        siguiente={ir({ fecha: sumarDias(fecha, salto) })}
      >
      <div className="mt-8 min-h-[50vh] space-y-8">
        {visibles.length === 0 && (
          <p className="rounded-2xl border border-(--n-texto)/10 bg-(--n-tarjeta) p-6 text-(--n-texto)/65">
            No hay turnos en esta semana.
          </p>
        )}
        {visibles.map((dia) => {
          const items = (porDia.get(dia) ?? []).sort((a, b) => a.orden.localeCompare(b.orden));
          return (
            <section key={dia} aria-label={formatoFechaLarga(dia)}>
              {vista === "semana" && (
                <h2 className="mb-3 font-display text-xl font-bold capitalize">
                  {formatoFechaLarga(dia)}
                </h2>
              )}
              {items.length === 0 ? (
                <p className="rounded-2xl border border-(--n-texto)/10 bg-(--n-tarjeta) p-6 text-(--n-texto)/65">
                  Sin turnos este día.
                </p>
              ) : (
                <ListaDelDia items={items} horaAhora={dia === hoy ? horaAhora : undefined} />
              )}
            </section>
          );
        })}
      </div>
      </Deslizar>
      <p className="mt-6 text-center text-xs text-(--n-texto)/40 md:hidden">
        Deslizá a los costados para cambiar de {vista === "semana" ? "semana" : "día"}.
      </p>
    </PanelShell>
  );
}
