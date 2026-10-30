import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ahoraMs, formatoHora, hoyEn, instanteLocal, parseRango } from "@/lib/fechas";
import { cargarContexto, texto, uno } from "../contexto";
import { PanelShell, SinAcceso } from "../shell";

export const metadata: Metadata = {
  title: "Resumen",
  robots: { index: false, follow: false },
};

export default function Resumen({ searchParams }: PageProps<"/panel/resumen">) {
  return (
    <Suspense fallback={<p className="p-8 text-white/50">Cargando el resumen…</p>}>
      <Contenido searchParams={searchParams} />
    </Suspense>
  );
}

type Fila = {
  rango: string;
  estado: string;
  precio_final: number | null;
  servicios: { nombre: string } | { nombre: string }[] | null;
  profesionales: { nombre: string } | { nombre: string }[] | null;
};

function sumarMeses(mes: string, n: number): string {
  const [a, m] = mes.split("-").map(Number);
  const f = new Date(Date.UTC(a, m - 1 + n, 1));
  return `${f.getUTCFullYear()}-${String(f.getUTCMonth() + 1).padStart(2, "0")}`;
}

function nombreMes(mes: string): string {
  const [a, m] = mes.split("-").map(Number);
  return new Intl.DateTimeFormat("es-UY", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(a, m - 1, 1)));
}

const pesos = (n: number) => `$${Math.round(n).toLocaleString("es-UY")}`;

function Barra({
  etiqueta,
  valor,
  maximo,
  detalle,
}: {
  etiqueta: string;
  valor: number;
  maximo: number;
  detalle?: string;
}) {
  return (
    <li className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 text-sm">
      <span className="truncate font-semibold">{etiqueta}</span>
      <span className="h-3 overflow-hidden rounded-full bg-(--n-texto)/10">
        <span
          className="block h-full rounded-full bg-(--n-acento)"
          style={{ width: `${maximo > 0 ? Math.max(4, (valor / maximo) * 100) : 0}%` }}
        />
      </span>
      <span className="tabular-nums text-(--n-texto)/70">{detalle ?? valor}</span>
    </li>
  );
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
  const mesActual = hoyEn(tz).slice(0, 7);
  const pedido = texto(params.mes);
  const mes = pedido && /^\d{4}-(0[1-9]|1[0-2])$/.test(pedido) ? pedido : mesActual;

  const { data } = await supabase
    .from("reservas")
    .select("rango, estado, precio_final, servicios(nombre), profesionales(nombre)")
    .eq("negocio_id", negocio.id)
    .neq("origen", "bloqueo")
    .overlaps(
      "rango",
      `[${instanteLocal(`${mes}-01`, "00:00", tz)},${instanteLocal(`${sumarMeses(mes, 1)}-01`, "00:00", tz)})`,
    );

  let vinieron = 0;
  let faltaron = 0;
  let sinMarcar = 0;
  let proximos = 0;
  let canceladas = 0;
  let ingresos = 0;
  const servicios = new Map<string, { turnos: number; ingresos: number }>();
  const profesionales = new Map<string, number>();
  const horas = new Map<number, number>();

  for (const f of (data ?? []) as Fila[]) {
    const { inicio } = parseRango(f.rango);
    if (f.estado === "cancelada") {
      canceladas++;
      continue;
    }
    if (f.estado === "completada") {
      vinieron++;
      ingresos += Number(f.precio_final ?? 0);
    } else if (f.estado === "no_show") faltaron++;
    else if (new Date(inicio).getTime() <= ahora) sinMarcar++;
    else proximos++;

    const nombre = uno(f.servicios)?.nombre ?? "Turno";
    const s = servicios.get(nombre) ?? { turnos: 0, ingresos: 0 };
    s.turnos++;
    if (f.estado === "completada") s.ingresos += Number(f.precio_final ?? 0);
    servicios.set(nombre, s);

    const prof = uno(f.profesionales)?.nombre ?? "—";
    profesionales.set(prof, (profesionales.get(prof) ?? 0) + 1);
    const hora = Number(formatoHora(inicio, tz).slice(0, 2));
    horas.set(hora, (horas.get(hora) ?? 0) + 1);
  }

  const turnos = vinieron + faltaron + sinMarcar + proximos;
  const marcados = vinieron + faltaron;
  const asistencia = marcados > 0 ? Math.round((vinieron / marcados) * 100) : null;

  const topServicios = [...servicios.entries()]
    .sort((a, b) => b[1].turnos - a[1].turnos)
    .slice(0, 5);
  const porProfesional = [...profesionales.entries()].sort((a, b) => b[1] - a[1]);
  const topHoras = [...horas.entries()].sort((a, b) => a[0] - b[0]);
  const maxHora = Math.max(0, ...topHoras.map(([, n]) => n));

  const flecha =
    "inline-flex size-11 items-center justify-center rounded-full border border-(--n-texto)/20 hover:border-(--n-texto)/50";

  return (
    <PanelShell ctx={ctx} activa="resumen">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-3xl font-extrabold capitalize">{nombreMes(mes)}</h2>
        <div className="flex items-center gap-2">
          <Link
            href={enlace("/panel/resumen", { mes: sumarMeses(mes, -1) })}
            aria-label="Mes anterior"
            className={flecha}
          >
            ←
          </Link>
          {mes !== mesActual && (
            <Link
              href={enlace("/panel/resumen", { mes: sumarMeses(mes, 1) })}
              aria-label="Mes siguiente"
              className={flecha}
            >
              →
            </Link>
          )}
        </div>
      </div>

      {turnos === 0 && canceladas === 0 ? (
        <p className="mt-6 rounded-3xl border border-(--n-texto)/10 bg-(--n-tarjeta) p-6 text-(--n-texto)/65">
          No hay turnos en este mes todavía.
        </p>
      ) : (
        <>
          <section className="mt-5 grid grid-cols-2 gap-3" aria-label="Asistencia">
            <div className="rounded-3xl border border-(--n-acento)/40 bg-(--n-acento)/10 p-5">
              <p className="font-display text-5xl font-extrabold text-(--n-acento)">✓ {vinieron}</p>
              <p className="mt-1 font-semibold">Se presentaron</p>
            </div>
            <div className="rounded-3xl border border-amber-300/40 bg-amber-400/10 p-5">
              <p className="font-display text-5xl font-extrabold text-amber-300">✗ {faltaron}</p>
              <p className="mt-1 font-semibold">No se presentaron</p>
            </div>
          </section>

          <section className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Totales">
            <div className="rounded-2xl border border-(--n-texto)/10 bg-(--n-tarjeta) p-4">
              <p className="font-display text-2xl font-extrabold">{turnos}</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-(--n-texto)/55">
                Turnos
              </p>
            </div>
            <div className="rounded-2xl border border-(--n-texto)/10 bg-(--n-tarjeta) p-4">
              <p className="font-display text-2xl font-extrabold">
                {asistencia === null ? "—" : `${asistencia}%`}
              </p>
              <p className="text-xs font-semibold uppercase tracking-wider text-(--n-texto)/55">
                Asistencia
              </p>
            </div>
            <div className="rounded-2xl border border-(--n-texto)/10 bg-(--n-tarjeta) p-4">
              <p className="font-display text-2xl font-extrabold">{pesos(ingresos)}</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-(--n-texto)/55">
                Ingresos
              </p>
            </div>
            <div className="rounded-2xl border border-(--n-texto)/10 bg-(--n-tarjeta) p-4">
              <p className="font-display text-2xl font-extrabold">{canceladas}</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-(--n-texto)/55">
                Cancelados
              </p>
            </div>
          </section>

          <p className="mt-3 text-sm text-(--n-texto)/55">
            Los ingresos suman los turnos a los que el cliente vino, a su precio del momento.
            {sinMarcar > 0 && ` Hay ${sinMarcar} sin marcar: ahí se completan los números.`}
            {proximos > 0 && ` Faltan ${proximos} por venir.`}
          </p>

          {topServicios.length > 0 && (
            <section className="mt-8" aria-label="Servicios más pedidos">
              <h3 className="font-display text-xl font-bold">Lo más pedido</h3>
              <ul className="mt-3 space-y-3 rounded-3xl border border-(--n-texto)/10 bg-(--n-tarjeta) p-5">
                {topServicios.map(([nombre, s]) => (
                  <Barra
                    key={nombre}
                    etiqueta={nombre}
                    valor={s.turnos}
                    maximo={topServicios[0][1].turnos}
                    detalle={`${s.turnos} ${s.turnos === 1 ? "turno" : "turnos"}`}
                  />
                ))}
              </ul>
            </section>
          )}

          {topHoras.length > 0 && (
            <section className="mt-8" aria-label="Horas con más turnos">
              <h3 className="font-display text-xl font-bold">Horas con más turnos</h3>
              <ul className="mt-3 space-y-3 rounded-3xl border border-(--n-texto)/10 bg-(--n-tarjeta) p-5">
                {topHoras.map(([hora, n]) => (
                  <Barra
                    key={hora}
                    etiqueta={`${String(hora).padStart(2, "0")}:00`}
                    valor={n}
                    maximo={maxHora}
                  />
                ))}
              </ul>
            </section>
          )}

          {porProfesional.length > 1 && (
            <section className="mt-8" aria-label="Turnos por profesional">
              <h3 className="font-display text-xl font-bold">Por profesional</h3>
              <ul className="mt-3 space-y-3 rounded-3xl border border-(--n-texto)/10 bg-(--n-tarjeta) p-5">
                {porProfesional.map(([nombre, n]) => (
                  <Barra key={nombre} etiqueta={nombre} valor={n} maximo={porProfesional[0][1]} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </PanelShell>
  );
}
