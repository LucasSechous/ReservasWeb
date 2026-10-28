import { NextResponse, type NextRequest } from "next/server";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { urlBase } from "@/lib/url";

// Recibe el link mágico: canjea el código por una sesión y manda al panel.
export async function GET(request: NextRequest) {
  const base = await urlBase();
  const codigo = request.nextUrl.searchParams.get("code");

  if (codigo) {
    const supabase = await crearClienteSesion();
    const { error } = await supabase.auth.exchangeCodeForSession(codigo);
    if (!error) return NextResponse.redirect(`${base}/panel`);
  }
  return NextResponse.redirect(`${base}/login?error=1`);
}
