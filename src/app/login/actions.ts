"use server";

import { crearClienteSesion } from "@/lib/supabase/sesion";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export type ResultadoLogin = { ok: true; destino: string } | { ok: false; mensaje: string };

// Entra con mail y contraseña. Ante un error de datos se responde siempre lo mismo, exista o no el
// mail, para no revelar quién tiene cuenta.
export async function entrar(email: string, contrasena: string): Promise<ResultadoLogin> {
  const limpio = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (limpio.length > 200 || !EMAIL.test(limpio)) {
    return { ok: false, mensaje: "Revisá el mail: parece que no es válido." };
  }
  if (typeof contrasena !== "string" || contrasena === "" || contrasena.length > 200) {
    return { ok: false, mensaje: "Escribí tu contraseña." };
  }

  const supabase = await crearClienteSesion();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: limpio,
    password: contrasena,
  });

  if (error || !data.user) {
    return {
      ok: false,
      mensaje:
        error?.status === 429
          ? "Hiciste muchos intentos seguidos. Esperá unos minutos y probá de nuevo."
          : "El mail o la contraseña no coinciden. Revisalos y probá de nuevo.",
    };
  }

  const debeCambiar = data.user.user_metadata?.debe_cambiar_password === true;
  return { ok: true, destino: debeCambiar ? "/cambiar-contrasena" : "/panel" };
}
