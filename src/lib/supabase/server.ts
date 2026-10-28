import { createClient } from "@supabase/supabase-js";

// Cliente con la clave pública (publishable). Solo lee lo que permite RLS.
// La service_role NO va acá: si hace falta, se usa solo en código de servidor aparte.
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (ver .env.example)",
    );
  }

  return createClient(url, key, { auth: { persistSession: false } });
}
