import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { EsqueletoPanel } from "@/components/esqueleto-panel";
import { MarcoAcceso } from "@/components/marco-acceso";
import { obtenerSesion } from "@/lib/supabase/sesion";
import { CambiarForm } from "./cambiar-form";

export const metadata: Metadata = {
  title: "Elegí tu contraseña",
  robots: { index: false, follow: false },
};

export default function CambiarContrasena() {
  return (
    <Suspense fallback={<EsqueletoPanel />}>
      <Contenido />
    </Suspense>
  );
}

async function Contenido() {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/login");

  const primera = sesion.debeCambiarContrasena;
  return (
    <MarcoAcceso
      titulo={primera ? "Te damos la bienvenida" : "Cambiar contraseña"}
      bajada={
        primera
          ? "La contraseña con la que entraste es provisoria. Elegí una que solo sepas vos, con al menos 8 caracteres."
          : "Elegí una contraseña nueva, con al menos 8 caracteres."
      }
    >
      <CambiarForm obligatorio={primera} />
    </MarcoAcceso>
  );
}
