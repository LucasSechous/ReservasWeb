import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { leerConfigSupabase } from "@/lib/supabase/server";

// Renueva la sesión de Supabase (los tokens vencen) en las rutas que la usan.
// Las páginas públicas (vitrina, landings, reserva) no pasan por acá.
export async function proxy(request: NextRequest) {
  let respuesta = NextResponse.next({ request });
  const { url, key } = leerConfigSupabase();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (lista) => {
        for (const { name, value } of lista) request.cookies.set(name, value);
        respuesta = NextResponse.next({ request });
        for (const { name, value, options } of lista) {
          respuesta.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Los paneles no se renderizan sin sesión: se corta acá, antes de empezar la página.
  const ruta = request.nextUrl.pathname;
  const protegida =
    ruta.startsWith("/panel") ||
    ruta.startsWith("/operador") ||
    ruta.startsWith("/cambiar-contrasena");
  if (protegida && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return respuesta;
}

export const config = {
  matcher: ["/panel/:path*", "/operador/:path*", "/cambiar-contrasena", "/login", "/auth/:path*"],
};
