import Link from "next/link";
import type { ReactNode } from "react";
import type { ContextoPanel } from "./contexto";

// Marco común de todas las pantallas del panel: encabezado, navegación (abajo en el celular,
// arriba en la compu) y el botón para agendar un turno, siempre a mano.
export type Seccion = "hoy" | "agenda" | "clientes" | "resumen" | "nuevo";

// Los colores del panel salen de las mismas variables --n-* que usa el flujo de reserva, así los
// selectores de día y hora funcionan igual acá.
const VARIABLES = {
  "--n-fondo": "#0c1626",
  "--n-texto": "#eef3fb",
  "--n-tarjeta": "#132338",
  "--n-acento": "#3ddc97",
  "--n-acento-tinta": "#04150d",
  "--n-detalle": "#7aa7ff",
  "--n-error": "#fecaca",
} as React.CSSProperties;

function Icono({ nombre }: { nombre: Seccion }) {
  const trazo = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden {...trazo}>
      {nombre === "hoy" && (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5V12l3 2" />
        </>
      )}
      {nombre === "agenda" && (
        <>
          <rect x="4" y="5.5" width="16" height="14.5" rx="3" />
          <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
        </>
      )}
      {nombre === "clientes" && (
        <>
          <circle cx="9" cy="9" r="3.2" />
          <path d="M3.5 19c.6-3 2.8-4.6 5.5-4.6s4.9 1.6 5.5 4.6" />
          <path d="M16 6.3a3 3 0 010 5.6M17.5 14.7c1.7.5 2.8 2 3 4.3" />
        </>
      )}
      {nombre === "resumen" && (
        <>
          <path d="M5 20V11M12 20V5M19 20v-7" />
        </>
      )}
      {nombre === "nuevo" && <path d="M12 5v14M5 12h14" />}
    </svg>
  );
}

const SECCIONES: { id: Seccion; etiqueta: string; ruta: string }[] = [
  { id: "hoy", etiqueta: "Hoy", ruta: "/panel" },
  { id: "agenda", etiqueta: "Agenda", ruta: "/panel/agenda" },
  { id: "clientes", etiqueta: "Clientes", ruta: "/panel/clientes" },
  { id: "resumen", etiqueta: "Resumen", ruta: "/panel/resumen" },
];

export function SalirBoton() {
  return (
    <form action="/auth/salir" method="post">
      <button
        type="submit"
        className="rounded-full border border-(--n-texto)/20 px-4 py-2 text-sm font-semibold hover:border-(--n-texto)/50"
      >
        Cerrar sesión
      </button>
    </form>
  );
}

export function PanelShell({
  ctx,
  activa,
  children,
}: {
  ctx: ContextoPanel;
  activa: Seccion;
  children: ReactNode;
}) {
  const { negocio, esOperador, enlace, sesion } = ctx;

  return (
    <div style={VARIABLES} className="min-h-screen bg-(--n-fondo) pb-28 text-(--n-texto) md:pb-12">
      <header className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-5 pt-5 md:pt-8">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-widest text-(--n-acento)">
            {esOperador ? "Mirando como operador" : "Tu panel"}
          </p>
          <h1 className="truncate font-display text-2xl font-extrabold sm:text-3xl">
            {negocio.nombre}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {esOperador && (
            <Link
              href="/operador"
              className="rounded-full bg-(--n-acento) px-4 py-2 text-sm font-semibold text-(--n-acento-tinta) hover:brightness-110"
            >
              ← Volver a mis negocios
            </Link>
          )}
          <SalirBoton />
        </div>
      </header>

      {/* Navegación en la compu */}
      <nav
        aria-label="Secciones del panel"
        className="mx-auto mt-6 hidden max-w-3xl items-center gap-2 px-5 md:flex"
      >
        {SECCIONES.map((s) => (
          <Link
            key={s.id}
            href={enlace(s.ruta)}
            aria-current={activa === s.id ? "page" : undefined}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
              activa === s.id
                ? "bg-(--n-texto) text-(--n-fondo)"
                : "text-(--n-texto)/70 hover:bg-(--n-texto)/10 hover:text-(--n-texto)"
            }`}
          >
            {s.etiqueta}
          </Link>
        ))}
        {activa !== "nuevo" && (
          <Link
            href={enlace("/panel/nuevo")}
            className="ml-auto inline-flex items-center gap-2 rounded-full bg-(--n-acento) px-5 py-2.5 text-sm font-bold text-(--n-acento-tinta) hover:brightness-110"
          >
            + Agendar un turno
          </Link>
        )}
      </nav>

      <main className="mx-auto mt-6 max-w-3xl px-5">{children}</main>

      <p className="mx-auto mt-10 max-w-3xl px-5 text-xs text-(--n-texto)/40">
        Entraste como {sesion.email}
      </p>

      {/* Botón para agendar, flotante en el celular */}
      {activa !== "nuevo" && (
        <Link
          href={enlace("/panel/nuevo")}
          className="fixed bottom-24 right-4 z-30 inline-flex items-center gap-2 rounded-full bg-(--n-acento) px-5 py-3.5 text-sm font-bold text-(--n-acento-tinta) shadow-[0_10px_40px_-8px_rgba(61,220,151,0.6)] md:hidden"
        >
          <Icono nombre="nuevo" /> Agendar
        </Link>
      )}

      {/* Navegación en el celular */}
      <nav
        aria-label="Secciones del panel"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-(--n-texto)/10 bg-(--n-fondo)/95 backdrop-blur md:hidden"
      >
        <ul className="mx-auto grid max-w-md grid-cols-4 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {SECCIONES.map((s) => (
            <li key={s.id}>
              <Link
                href={enlace(s.ruta)}
                aria-current={activa === s.id ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold ${
                  activa === s.id ? "text-(--n-acento)" : "text-(--n-texto)/60"
                }`}
              >
                <Icono nombre={s.id} />
                {s.etiqueta}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export function SinAcceso({ email }: { email: string }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-12">
      <h1 className="font-display text-3xl font-extrabold">Tu cuenta no tiene un panel</h1>
      <p className="mt-3 text-white/70">
        Entraste como {email}, pero ese mail no está asociado a ningún negocio. Si sos dueño o parte
        del equipo de un negocio, pedile a quien armó tu web que te dé de alta con este mail.
      </p>
      <div className="mt-6">
        <form action="/auth/salir" method="post">
          <button
            type="submit"
            className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold hover:border-white/50"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </main>
  );
}
