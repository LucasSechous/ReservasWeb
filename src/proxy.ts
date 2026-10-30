import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { slugPorDominio } from "@/lib/dominios";
import { leerConfigSupabase } from "@/lib/supabase/server";

// Renueva la sesión de Supabase (los tokens vencen) en las rutas que la usan.
// Las páginas públicas (vitrina, landings, reserva) no pasan por acá.
export async function proxy(request: NextRequest) {
  // Dominio propio de un negocio: su raíz y su página de reservas muestran la landing y la reserva
  // de ese negocio. Cualquier otra ruta (panel, login, gestión de turnos) sigue igual. En el dominio
  // de ReservasWeb esto no hace nada y sale antes de consultar la sesión.
  const rutaPublica = request.nextUrl.pathname;
  if (rutaPublica === "/" || rutaPublica === "/reservar") {
    const slugDominio = slugPorDominio(request.headers.get("host"));
    if (!slugDominio) return NextResponse.next();
    const destino = request.nextUrl.clone();
    destino.pathname = `/${slugDominio}${rutaPublica === "/" ? "" : rutaPublica}`;
    return NextResponse.rewrite(destino);
  }

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
  matcher: [
    "/",
    "/reservar",
    "/panel/:path*",
    "/operador/:path*",
    "/cambiar-contrasena",
    "/login",
    "/auth/:path*",
  ],
};
