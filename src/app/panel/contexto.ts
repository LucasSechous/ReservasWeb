import "server-only";
import { redirect } from "next/navigation";
import { crearClienteSesion, obtenerSesion, type Sesion } from "@/lib/supabase/sesion";

// Todo lo que necesita una pantalla del panel: quién entró, de qué negocio y cómo armar links.
// El operador elige el negocio con ?negocio=slug; un dueño ve siempre el suyo.
type Params = { [clave: string]: string | string[] | undefined };

export function texto(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

export function uno<T>(valor: T | T[] | null | undefined): T | null {
  return Array.isArray(valor) ? (valor[0] ?? null) : (valor ?? null);
}

export type NegocioPanel = {
  id: string;
  slug: string;
  nombre: string;
  timezone: string;
  telefono: string | null;
};

export type ContextoPanel = {
  sesion: Sesion;
  supabase: Awaited<ReturnType<typeof crearClienteSesion>>;
  negocio: NegocioPanel;
  esOperador: boolean;
  /** Arma un link dentro del panel conservando el negocio que mira el operador. */
  enlace: (ruta: string, extra?: Record<string, string>) => string;
};

export type ResultadoContexto = { ok: true; ctx: ContextoPanel } | { ok: false; email: string };

export async function cargarContexto(params: Params): Promise<ResultadoContexto> {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/login");
  if (sesion.debeCambiarContrasena) redirect("/cambiar-contrasena");
  if (!sesion.perfil) return { ok: false, email: sesion.email };

  const supabase = await crearClienteSesion();
  const esOperador = sesion.perfil.rol === "admin_plataforma";
  const slugElegido = texto(params.negocio);
  if (esOperador && !slugElegido) redirect("/operador");

  let consulta = supabase.from("negocios").select("id, slug, nombre, timezone, telefono");
  consulta =
    esOperador && slugElegido
      ? consulta.eq("slug", slugElegido)
      : consulta.eq("id", sesion.perfil.negocioId ?? "");
  const { data: negocio } = await consulta.maybeSingle();
  if (!negocio) return { ok: false, email: sesion.email };

  const enlace = (ruta: string, extra: Record<string, string> = {}) => {
    const q = new URLSearchParams();
    if (esOperador && slugElegido) q.set("negocio", slugElegido);
    for (const [clave, valor] of Object.entries(extra)) q.set(clave, valor);
    const cadena = q.toString();
    return cadena ? `${ruta}?${cadena}` : ruta;
  };

  return { ok: true, ctx: { sesion, supabase, negocio, esOperador, enlace } };
}
