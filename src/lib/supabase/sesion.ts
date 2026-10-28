import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { leerConfigSupabase } from "@/lib/supabase/server";

// Cliente de Supabase que actúa como la persona logueada (lee su sesión de las cookies).
// Todo lo que haga pasa por las políticas RLS de esa persona. Solo para código de servidor.
export async function crearClienteSesion() {
  const { url, key } = leerConfigSupabase();
  const almacen = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll: () => almacen.getAll(),
      setAll: (lista) => {
        try {
          for (const { name, value, options } of lista) {
            almacen.set(name, value, options);
          }
        } catch {
          // Desde un Server Component no se pueden escribir cookies: el proxy ya renueva la sesión.
        }
      },
    },
  });
}

export type Rol = "owner" | "staff" | "admin_plataforma";

export type Sesion = {
  userId: string;
  email: string;
  /** null = logueado pero sin acceso a ningún panel (nadie lo invitó). */
  perfil: { rol: Rol; negocioId: string | null } | null;
};

/** La persona logueada y su rol, o null si no hay sesión. Vincula su cuenta si la invitaron. */
export async function obtenerSesion(): Promise<Sesion | null> {
  const supabase = await crearClienteSesion();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.rpc("completar_perfil");
  const fila: { rol: Rol; negocio_id: string | null } | undefined = data?.[0];

  return {
    userId: user.id,
    email: user.email ?? "",
    perfil: fila ? { rol: fila.rol, negocioId: fila.negocio_id } : null,
  };
}
