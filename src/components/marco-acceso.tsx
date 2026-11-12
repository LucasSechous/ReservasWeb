import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/logo";

// Marco de las pantallas de entrada (login, elegir contraseña, cuenta sin panel).
// En la compu, a la izquierda se muestra lo que la persona va a encontrar adentro; en el celular,
// solo el formulario, con un brillo de fondo para que no quede una pantalla vacía.
export function MarcoAcceso({
  titulo,
  bajada,
  children,
}: {
  titulo: string;
  bajada: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden lg:grid lg:grid-cols-[1.05fr_1fr]">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-40 size-[34rem] rounded-full bg-accent/20 blur-3xl lg:hidden"
      />

      <aside className="relative hidden overflow-hidden border-r border-white/10 bg-ink-2 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden
          className="absolute -right-24 top-1/3 size-[30rem] rounded-full bg-accent/25 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-32 left-10 size-80 rounded-full bg-violeta/15 blur-3xl"
        />
        <Link href="/" aria-label="Tu Turno, ir al inicio" className="relative w-fit">
          <Logo />
        </Link>

        <div className="relative max-w-md">
          <p className="font-display text-4xl font-extrabold leading-tight">
            Tu agenda, ordenada sola.
          </p>
          <p className="mt-3 text-white/65">
            Los turnos que reservan tus clientes caen acá. Vos solo marcás quién vino.
          </p>

          {/* Una muestra de la pantalla «Hoy» del panel, decorativa. */}
          <div aria-hidden className="mt-10 space-y-3">
            <div className="rounded-3xl border border-accent/40 bg-gradient-to-br from-accent/15 to-ink-3 p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-accent">
                Próximo turno · En 25 min
              </p>
              <p className="mt-2 font-display text-3xl font-extrabold">15:30</p>
              <p className="font-semibold">Sofía Méndez</p>
              <p className="text-sm text-white/60">Corte y color · con Lucía</p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-ink-3/80 px-4 py-3">
              <span className="grid size-8 place-items-center rounded-full bg-accent/15 text-sm font-bold text-accent">
                M
              </span>
              <span className="flex-1 text-sm">
                <span className="font-semibold">Martín</span>{" "}
                <span className="text-white/55">· 14:00</span>
              </span>
              <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent">
                ✓ Vino
              </span>
            </div>
          </div>
        </div>

        <p className="relative text-xs text-white/40">Tu Turno · reservas online para tu negocio</p>
      </aside>

      <main className="relative mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-12 lg:max-w-lg lg:px-12">
        <Link href="/" aria-label="Tu Turno, ir al inicio" className="w-fit lg:hidden">
          <Logo />
        </Link>
        <h1 className="mt-10 font-display text-3xl font-extrabold sm:text-4xl lg:mt-0">{titulo}</h1>
        <div className="mt-2 text-white/65">{bajada}</div>
        <div className="mt-8 rounded-3xl border border-white/10 bg-ink-2/70 p-5 backdrop-blur sm:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
