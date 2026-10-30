import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { crearClienteSesion, obtenerSesion } from "@/lib/supabase/sesion";
import { type NegocioListado, NegocioFila } from "./negocio-fila";

export const metadata: Metadata = {
  title: "Operador",
  robots: { index: false, follow: false },
};

export default function Operador({ searchParams }: PageProps<"/operador">) {
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
  const { creado } = await searchParams;
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/login");
  if (sesion.debeCambiarContrasena) redirect("/cambiar-contrasena");
  if (sesion.perfil?.rol !== "admin_plataforma") redirect("/panel");

  const supabase = await crearClienteSesion();
  const { data } = await supabase
    .from("negocios")
    .select("id, slug, nombre, activo, email")
    .order("created_at", { ascending: false });
  const negocios: NegocioListado[] = data ?? [];
  const nuevo = typeof creado === "string" ? creado : null;

  return (
    <div className="mx-auto max-w-3xl px-5 py-6 sm:py-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Operador</p>
          <h1 className="font-display text-3xl font-extrabold">Negocios</h1>
          <p className="text-sm text-white/50">{sesion.email}</p>
        </div>
        <Link
          href="/operador/nuevo"
          className="inline-flex min-h-11 items-center rounded-full bg-accent px-6 font-bold text-accent-ink hover:brightness-110"
        >
          Alta de negocio
        </Link>
      </header>

      {nuevo && (
        <div className="mt-6 rounded-2xl border border-accent/40 bg-accent/10 p-5">
          <p className="font-bold">Listo, «{nuevo}» quedó creado.</p>
          <p className="mt-1 text-sm text-white/70">
            Ya se puede reservar en{" "}
            <Link href={`/${nuevo}`} className="font-semibold underline">
              /{nuevo}
            </Link>
            . Si cargaste el mail del dueño, para entrar a su agenda tiene que ir a{" "}
            <Link href="/login" className="font-semibold underline">
              /login
            </Link>{" "}
            con ese mail.
          </p>
        </div>
      )}

      <ul className="mt-8 space-y-3">
        {negocios.length === 0 && (
          <li className="rounded-2xl border border-white/10 bg-ink-2 p-6 text-white/65">
            Todavía no hay negocios. Empezá con «Alta de negocio».
          </li>
        )}
        {negocios.map((n) => (
          <NegocioFila key={n.id} negocio={n} />
        ))}
      </ul>

      <section className="mt-12 rounded-2xl border border-white/10 p-5 text-sm text-white/60">
        <h2 className="font-bold text-white">Identidad visual de un negocio</h2>
        <p className="mt-2">
          Un negocio nuevo sale con el diseño base. Para darle sus colores, agregá una entrada en{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5">src/lib/tema.ts</code> con su slug y,
          si tiene foto de portada, guardala en{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5">public/negocios/su-slug/portada.jpg</code>.
        </p>
      </section>

      <div className="mt-8">
        <form action="/auth/salir" method="post">
          <button
            type="submit"
            className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold hover:border-white/50"
          >
            Salir
          </button>
        </form>
      </div>
    </div>
  );
}
