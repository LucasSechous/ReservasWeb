import { createClient } from "@supabase/supabase-js";

// Cliente con la clave pública (publishable). Solo lee lo que permite RLS.
// La service_role NO va acá: si hace falta, se usa solo en código de servidor aparte.
//
// Acepta los nombres NEXT_PUBLIC_* (estándar de Supabase) y los NEXT_SUPABASE_*
// (los que quedaron cargados en Vercel). Este archivo corre solo en el servidor.
function leerConfig() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.NEXT_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Faltan las variables de Supabase: URL (NEXT_PUBLIC_SUPABASE_URL o NEXT_SUPABASE_URL) y clave pública (NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY o NEXT_SUPABASE_PUBLISHABLE_KEY). Ver .env.example",
    );
  }

  return { url, key };
}

export function createPublicClient() {
  const { url, key } = leerConfig();
  return createClient(url, key, { auth: { persistSession: false } });
}
