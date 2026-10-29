import "server-only";
import { createClient } from "@supabase/supabase-js";
import { leerConfigSupabase } from "@/lib/supabase/server";

// Cliente con la service_role: se salta la RLS. Solo para código de servidor que valida todo antes
// (hoy, las funciones gestion_* de /reserva/[token]). La clave vive en una variable SIN prefijo NEXT_PUBLIC_
// y este archivo no se puede importar desde un componente de cliente (server-only).
export function createAdminClient() {
  const { url } = leerConfigSupabase();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY (solo servidor). Ver .env.example");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
