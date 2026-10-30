"use server";

import { crearClienteSesion } from "@/lib/supabase/sesion";

const LARGO_MINIMO = 8;

export type ResultadoCambio = { ok: true } | { ok: false; mensaje: string };

// Cambia la contraseña de quien está logueado y apaga la marca de "contraseña inicial".
export async function cambiarContrasena(nueva: string, repetida: string): Promise<ResultadoCambio> {
  if (typeof nueva !== "string" || nueva.length < LARGO_MINIMO || nueva.length > 72) {
    return {
      ok: false,
      mensaje: `La contraseña tiene que tener entre ${LARGO_MINIMO} y 72 caracteres.`,
    };
  }
  if (nueva !== repetida) {
    return { ok: false, mensaje: "Las dos contraseñas no son iguales. Escribilas de nuevo." };
  }

  const supabase = await crearClienteSesion();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, mensaje: "Tu sesión venció. Volvé a entrar." };

  const { error } = await supabase.auth.updateUser({
    password: nueva,
    data: { debe_cambiar_password: false },
  });
  if (error) {
    return {
      ok: false,
      mensaje: /different|same/i.test(error.message)
        ? "La contraseña nueva tiene que ser distinta de la que tenías."
        : "No pudimos guardar la contraseña. Probá con otra o intentá de nuevo en unos minutos.",
    };
  }
  return { ok: true };
}
