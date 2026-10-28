import { NextResponse } from "next/server";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { urlBase } from "@/lib/url";

// Cierra la sesión. Solo por POST, para que un link ajeno no pueda sacar a alguien del panel.
export async function POST() {
  const supabase = await crearClienteSesion();
  await supabase.auth.signOut();
  return NextResponse.redirect(`${await urlBase()}/login`, 303);
}
