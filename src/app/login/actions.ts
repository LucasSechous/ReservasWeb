"use server";

import { crearClienteSesion } from "@/lib/supabase/sesion";
import { urlBase } from "@/lib/url";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export type ResultadoLogin = { ok: true } | { ok: false; mensaje: string };

// Pide el link mágico. Se responde siempre lo mismo, tenga o no acceso ese mail, para no revelar
// quién está dado de alta. Quien no fue invitado entra a una cuenta sin ningún panel.
export async function pedirLink(email: string): Promise<ResultadoLogin> {
  const limpio = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (limpio.length > 200 || !EMAIL.test(limpio)) {
    return { ok: false, mensaje: "Revisá el mail: parece que no es válido." };
  }

  const supabase = await crearClienteSesion();
  const { error } = await supabase.auth.signInWithOtp({
    email: limpio,
    options: { emailRedirectTo: `${await urlBase()}/auth/callback` },
  });

  if (error) {
    return {
      ok: false,
      mensaje:
        error.status === 429
          ? "Pediste demasiados links seguidos. Esperá unos minutos y probá de nuevo."
          : "No pudimos enviar el link. Probá de nuevo en unos minutos.",
    };
  }
  return { ok: true };
}
