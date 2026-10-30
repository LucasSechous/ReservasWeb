import type { Metadata } from "next";
import { Suspense } from "react";
import { claveCliente, UMBRAL_AUSENCIAS } from "@/lib/clientes";
import { fechaLocalDe, formatoFechaLarga, formatoHora, parseRango } from "@/lib/fechas";
import { cargarContexto, uno } from "../contexto";
import { PanelShell, SinAcceso } from "../shell";
import { ListaClientes, type ClienteFicha } from "./lista-clientes";

export const metadata: Metadata = {
  title: "Clientes",
  robots: { index: false, follow: false },
};

export default function Clientes({ searchParams }: PageProps<"/panel/clientes">) {
  return (
    <Suspense fallback={<p className="p-8 text-white/50">Cargando clientes…</p>}>
      <Contenido searchParams={searchParams} />
    </Suspense>
  );
}

type Fila = {
  rango: string;
  estado: string;
  cliente_nombre: string | null;
  cliente_telefono: string | null;
  cliente_email: string | null;
  servicios: { nombre: string } | { nombre: string }[] | null;
};

async function Contenido({
  searchParams,
}: {
  searchParams: Promise<{ [clave: string]: string | string[] | undefined }>;
}) {
  const r = await cargarContexto(await searchParams);
  if (!r.ok) return <SinAcceso email={r.email} />;
  const { ctx } = r;
  const { supabase, negocio } = ctx;
  const tz = negocio.timezone;

  const { data } = await supabase
    .from("reservas")
    .select("rango, estado, cliente_nombre, cliente_telefono, cliente_email, servicios(nombre)")
    .eq("negocio_id", negocio.id)
    .neq("origen", "bloqueo")
    .order("created_at", { ascending: false })
    .limit(3000);

  // Un mismo cliente puede reservar varias veces: se lo reconoce por teléfono, mail o nombre.
  const porCliente = new Map<string, { ficha: ClienteFicha; ultimo: string }>();
  for (const f of (data ?? []) as Fila[]) {
    const { inicio } = parseRango(f.rango);
    const clave = claveCliente({
      telefono: f.cliente_telefono,
      email: f.cliente_email,
      nombre: f.cliente_nombre,
    });
    let entrada = porCliente.get(clave);
    if (!entrada) {
      entrada = {
        ultimo: "",
        ficha: {
          clave,
          nombre: f.cliente_nombre ?? "Sin nombre",
          telefono: f.cliente_telefono?.trim() || null,
          email: f.cliente_email,
          vino: 0,
          falto: 0,
          canceladas: 0,
          pendientes: 0,
          ultimaVez: null,
          historial: [],
        },
      };
      porCliente.set(clave, entrada);
    }
    const { ficha } = entrada;
    if (f.estado === "completada") ficha.vino++;
    else if (f.estado === "no_show") ficha.falto++;
    else if (f.estado === "cancelada") ficha.canceladas++;
    else ficha.pendientes++;

    // El nombre y los datos de contacto más recientes son los que valen.
    if (inicio > entrada.ultimo) {
      entrada.ultimo = inicio;
      ficha.nombre = f.cliente_nombre ?? ficha.nombre;
      ficha.telefono = f.cliente_telefono?.trim() || ficha.telefono;
      ficha.email = f.cliente_email ?? ficha.email;
      ficha.ultimaVez = formatoFechaLarga(fechaLocalDe(inicio, tz));
    }
    ficha.historial.push({
      inicio,
      cuando: `${formatoFechaLarga(fechaLocalDe(inicio, tz))}, ${formatoHora(inicio, tz)}`,
      servicio: uno(f.servicios)?.nombre ?? "Turno",
      estado: f.estado,
    });
  }

  const clientes = [...porCliente.values()]
    .sort((a, b) => b.ultimo.localeCompare(a.ultimo))
    .map(({ ficha }) => ({
      ...ficha,
      historial: ficha.historial.sort((a, b) => b.inicio.localeCompare(a.inicio)).slice(0, 15),
    }));

  return (
    <PanelShell ctx={ctx} activa="clientes">
      <h2 className="font-display text-3xl font-extrabold">Clientes</h2>
      <p className="mt-1 text-(--n-texto)/65">
        Quiénes te reservaron, cuántas veces vinieron y cuántas faltaron. Solo lo ves vos.
      </p>
      <div className="mt-6">
        <ListaClientes clientes={clientes} umbral={UMBRAL_AUSENCIAS} />
      </div>
    </PanelShell>
  );
}
