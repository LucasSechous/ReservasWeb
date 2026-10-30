import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { obtenerSesion } from "@/lib/supabase/sesion";
import { NuevoForm } from "./nuevo-form";

export const metadata: Metadata = {
  title: "Alta de negocio",
  robots: { index: false, follow: false },
};

export default function Nuevo() {
  return (
    <Suspense fallback={<p className="p-8 text-white/50">Cargando…</p>}>
      <Contenido />
    </Suspense>
  );
}

async function Contenido() {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/login");
  if (sesion.debeCambiarContrasena) redirect("/cambiar-contrasena");
  if (sesion.perfil?.rol !== "admin_plataforma") redirect("/panel");

  return (
    <div className="mx-auto max-w-2xl px-5 py-6 sm:py-10">
      <Link href="/operador" className="text-sm font-semibold text-white/60 hover:text-white">
        ← Negocios
      </Link>
      <h1 className="mt-4 font-display text-3xl font-extrabold">Alta de negocio</h1>
      <p className="mt-2 text-white/60">
        Con esto el negocio queda listo para recibir reservas. Después podés darle sus colores y su foto.
      </p>
      <div className="mt-8">
        <NuevoForm />
      </div>
    </div>
  );
}
