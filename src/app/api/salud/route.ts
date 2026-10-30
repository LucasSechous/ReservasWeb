import { NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/server";

// Punto de control para un monitor externo (UptimeRobot, Better Stack…): responde 200 si la app y la
// base andan, y 503 si no. El monitor consulta cada pocos minutos y avisa por mail cuando falla.
// Además mantiene activa la base: Supabase gratis la pausa tras una semana sin uso.
const SIN_CACHE = { "Cache-Control": "no-store" };

export async function GET() {
  try {
    const { error } = await createPublicClient()
      .from("negocios")
      .select("id", { count: "exact", head: true });
    if (error) throw error;
    return NextResponse.json({ ok: true }, { headers: SIN_CACHE });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503, headers: SIN_CACHE });
  }
}
