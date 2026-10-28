import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/server";

export type Negocio = {
  id: string;
  slug: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  timezone: string;
  anticipacion_minutos: number;
  ventana_dias: number;
};

export type Servicio = {
  id: string;
  nombre: string;
  descripcion: string | null;
  duracion_minutos: number;
  precio: number;
};

export type Profesional = {
  id: string;
  nombre: string;
  foto_url: string | null;
  /** Ids de los servicios que hace. */
  servicios: string[];
};

// Lectura pública: solo trae lo que la RLS deja ver (negocios y servicios activos).
export const getNegocio = cache(async (slug: string): Promise<Negocio | null> => {
  const { data } = await createPublicClient()
    .from("negocios")
    .select(
      "id, slug, nombre, telefono, email, direccion, timezone, anticipacion_minutos, ventana_dias",
    )
    .eq("slug", slug)
    .maybeSingle();
  return data;
});

export const getServicios = cache(async (negocioId: string): Promise<Servicio[]> => {
  const { data } = await createPublicClient()
    .from("servicios")
    .select("id, nombre, descripcion, duracion_minutos, precio")
    .eq("negocio_id", negocioId)
    .order("precio", { ascending: true });
  return (data ?? []).map((s) => ({ ...s, precio: Number(s.precio) }));
});

export const getProfesionales = cache(
  async (negocioId: string): Promise<Profesional[]> => {
    const { data } = await createPublicClient()
      .from("profesionales")
      .select("id, nombre, foto_url, profesional_servicios(servicio_id)")
      .eq("negocio_id", negocioId)
      .order("created_at", { ascending: true });
    return (data ?? []).map((p) => ({
      id: p.id,
      nombre: p.nombre,
      foto_url: p.foto_url,
      servicios: (p.profesional_servicios ?? []).map(
        (ps: { servicio_id: string }) => ps.servicio_id,
      ),
    }));
  },
);

export function formatoPrecio(valor: number): string {
  return new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: "UYU",
    maximumFractionDigits: 0,
  }).format(valor);
}

export function formatoDuracion(minutos: number): string {
  if (minutos < 60) return `${minutos} min`;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}
