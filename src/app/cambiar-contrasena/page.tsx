import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { obtenerSesion } from "@/lib/supabase/sesion";
import { CambiarForm } from "./cambiar-form";

export const metadata: Metadata = {
  title: "Elegí tu contraseña",
  robots: { index: false, follow: false },
};

export default function CambiarContrasena() {
  return (
    <Suspense fallback={<p className="p-8 text-white/50">Cargando…</p>}>
      <Contenido />
    </Suspense>
  );
}

async function Contenido() {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/login");

  const primera = sesion.debeCambiarContrasena;
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-12">
      <h1 className="font-display text-3xl font-extrabold">
        {primera ? "Bienvenido. Elegí tu contraseña" : "Cambiar contraseña"}
      </h1>
      <p className="mt-2 text-white/65">
        {primera
          ? "La contraseña con la que entraste es provisoria. Elegí una que solo sepas vos, con al menos 8 caracteres."
          : "Elegí una contraseña nueva, con al menos 8 caracteres."}
      </p>
      <div className="mt-8">
        <CambiarForm obligatorio={primera} />
      </div>
    </main>
  );
}
