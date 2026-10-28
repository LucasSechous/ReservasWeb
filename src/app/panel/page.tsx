import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import {
  fechaLocalDe,
  formatoFechaLarga,
  formatoHora,
  hoyEn,
  instanteLocal,
  parseRango,
  sumarDias,
} from "@/lib/fechas";
import { crearClienteSesion, obtenerSesion } from "@/lib/supabase/sesion";
import { BloquearForm } from "./bloquear-form";
import { type ItemAgenda, ReservaItem } from "./reserva-item";

export const metadata: Metadata = {
  title: "Agenda",
  robots: { index: false, follow: false },
};

type Params = { [clave: string]: string | string[] | undefined };

export default function Panel({ searchParams }: PageProps<"/panel">) {
  return (
    <Suspense fallback={<p className="p-8 text-white/50">Cargando tu agenda…</p>}>
      <Contenido searchParams={searchParams} />
    </Suspense>
  );
}

function uno<T>(valor: T | T[] | null | undefined): T | null {
  return Array.isArray(valor) ? (valor[0] ?? null) : (valor ?? null);
}

function texto(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

function lunesDe(fecha: string): string {
  const [a, m, d] = fecha.split("-").map(Number);
  const diaSemana = new Date(Date.UTC(a, m - 1, d)).getUTCDay(); // 0 = domingo
  return sumarDias(fecha, -((diaSemana + 6) % 7));
}

function SalirBoton() {
  return (
    <form action="/auth/salir" method="post">
      <button
        type="submit"
        className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold hover:border-white/50"
      >
        Salir
      </button>
    </form>
  );
}

function SinAcceso({ email }: { email: string }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-12">
      <h1 className="font-display text-3xl font-extrabold">Tu cuenta no tiene un panel</h1>
      <p className="mt-3 text-white/70">
        Entraste como {email}, pero ese mail no está asociado a ningún negocio. Si sos dueño o
        parte del equipo de un negocio, pedile a quien armó tu web que te dé de alta con este mail.
      </p>
      <div className="mt-6">
        <SalirBoton />
      </div>
    </main>
  );
}

async function Contenido({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/login");
  if (!sesion.perfil) return <SinAcceso email={sesion.email} />;

  const supabase = await crearClienteSesion();
  const esOperador = sesion.perfil.rol === "admin_plataforma";
  const slugElegido = texto(params.negocio);

  // El operador elige qué negocio mirar con ?negocio=slug; un dueño ve siempre el suyo.
  if (esOperador && !slugElegido) redirect("/operador");
  let consultaNegocio = supabase.from("negocios").select("id, slug, nombre, timezone");
  consultaNegocio =
    esOperador && slugElegido
      ? consultaNegocio.eq("slug", slugElegido)
      : consultaNegocio.eq("id", sesion.perfil.negocioId ?? "");
  const { data: negocio } = await consultaNegocio.maybeSingle();
  if (!negocio) return <SinAcceso email={sesion.email} />;

  const tz: string = negocio.timezone;
  const hoy = hoyEn(tz);
  const fechaPedida = texto(params.fecha);
  const fecha = fechaPedida && /^\d{4}-\d{2}-\d{2}$/.test(fechaPedida) ? fechaPedida : hoy;
  const vista = texto(params.vista) === "semana" ? "semana" : "dia";

  const desde = vista === "semana" ? lunesDe(fecha) : fecha;
  const hasta = vista === "semana" ? sumarDias(desde, 6) : fecha;
  const salto = vista === "semana" ? 7 : 1;

  const enlace = (cambios: { fecha?: string; vista?: string }) => {
    const q = new URLSearchParams();
    if (esOperador && slugElegido) q.set("negocio", slugElegido);
    q.set("vista", cambios.vista ?? vista);
    q.set("fecha", cambios.fecha ?? fecha);
    return `/panel?${q.toString()}`;
  };

  const [{ data: filas }, { data: profesionales }] = await Promise.all([
    supabase
      .from("reservas")
      .select(
        "id, rango, origen, cliente_nombre, cliente_telefono, cliente_email, notas, servicios(nombre), profesionales(nombre)",
      )
      .eq("estado", "confirmada")
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
  const porDia = new Map<string, (ItemAgenda & { orden: string })[]>();
  for (const f of filas ?? []) {
    const { inicio, fin } = parseRango(f.rango);
    const dia = fechaLocalDe(inicio, tz);
    const esBloqueo = f.origen === "bloqueo";
    const lista = porDia.get(dia) ?? [];
    lista.push({
      id: f.id,
      orden: inicio,
      horario: `${formatoHora(inicio, tz)} – ${formatoHora(fin, tz)}`,
      esBloqueo,
      servicio: uno<{ nombre: string }>(f.servicios)?.nombre ?? "Turno",
      profesional: uno<{ nombre: string }>(f.profesionales)?.nombre ?? "",
      cliente: f.cliente_nombre,
      telefono: f.cliente_telefono,
      email: f.cliente_email,
      notas: f.notas,
      origen: f.origen,
    });
    porDia.set(dia, lista);
  }

  const dias: string[] = [];
  for (let d = desde; d <= hasta; d = sumarDias(d, 1)) dias.push(d);
  const visibles = vista === "semana" ? dias.filter((d) => porDia.has(d)) : dias;
  const total = [...porDia.values()].reduce((n, l) => n + l.filter((i) => !i.esBloqueo).length, 0);

  const pestana = (activa: boolean) =>
    `rounded-full px-4 py-2 text-sm font-semibold ${
      activa ? "bg-accent text-accent-ink" : "border border-white/20 hover:border-white/50"
    }`;

  return (
    <div className="mx-auto max-w-3xl px-5 py-6 sm:py-10">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Agenda</p>
          <h1 className="font-display text-3xl font-extrabold">{negocio.nombre}</h1>
          <p className="text-sm text-white/50">{sesion.email}</p>
        </div>
        <SalirBoton />
      </header>

      <nav className="mt-6 flex flex-wrap items-center gap-2" aria-label="Vista de la agenda">
        <Link href={enlace({ vista: "dia" })} className={pestana(vista === "dia")}>
          Día
        </Link>
        <Link href={enlace({ vista: "semana" })} className={pestana(vista === "semana")}>
          Semana
        </Link>
        <span className="mx-1 hidden h-6 w-px bg-white/15 sm:block" />
        <Link
          href={enlace({ fecha: sumarDias(fecha, -salto) })}
          aria-label="Anterior"
          className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold hover:border-white/50"
        >
          ←
        </Link>
        <Link href={enlace({ fecha: hoy })} className={pestana(false)}>
          Hoy
        </Link>
        <Link
          href={enlace({ fecha: sumarDias(fecha, salto) })}
          aria-label="Siguiente"
          className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold hover:border-white/50"
        >
          →
        </Link>
      </nav>

      <p className="mt-5 text-white/70">
        {vista === "semana"
          ? `Semana del ${formatoFechaLarga(desde)} al ${formatoFechaLarga(hasta)}`
          : formatoFechaLarga(fecha)}
        {" · "}
        <span className="font-semibold text-white">
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

      <div className="mt-8 space-y-8">
        {visibles.length === 0 && (
          <p className="rounded-2xl border border-white/10 bg-ink-2 p-6 text-white/65">
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
                <p className="rounded-2xl border border-white/10 bg-ink-2 p-6 text-white/65">
                  Sin turnos este día.
                </p>
              ) : (
                <ul className="space-y-3">
                  {items.map((item) => (
                    <ReservaItem key={item.id} item={item} />
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
