import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BannerDemo } from "@/components/banner-demo";
import { getNegocio, getProfesionales, getServicios } from "@/lib/negocios";
import { getTema, temaStyle } from "@/lib/tema";
import { vocabularioDe } from "@/lib/vocabulario";
import { ReservaFlow } from "./reserva-flow";

export async function generateMetadata({
  params,
}: PageProps<"/[slug]/reservar">): Promise<Metadata> {
  const { slug } = await params;
  const negocio = await getNegocio(slug);
  if (!negocio) return {};
  return {
    title: `Reservar en ${negocio.nombre}`,
    description: `Elegí el servicio, el día y el horario en ${negocio.nombre}. Sin llamadas, a cualquier hora.`,
    alternates: { canonical: `/${slug}/reservar` },
  };
}

export default function Reservar({ params }: PageProps<"/[slug]/reservar">) {
  return (
    <Suspense
      fallback={<div aria-busy="true" className="min-h-screen" />}
    >
      <Contenido params={params} />
    </Suspense>
  );
}

async function Contenido({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const negocio = await getNegocio(slug);
  if (!negocio) notFound();

  const tema = getTema(negocio.slug);
  // Una landing simple no recibe reservas: esta página no existe para ella.
  if (tema.reservas === false) notFound();

  const [servicios, profesionales] = await Promise.all([
    getServicios(negocio.id),
    getProfesionales(negocio.id),
  ]);

  return (
    <div
      style={temaStyle(tema)}
      data-estilo={tema.estilo}
      className="min-h-screen bg-(--n-fondo) text-(--n-texto) selection:bg-(--n-acento) selection:text-(--n-acento-tinta)"
    >
      {tema.demo && <BannerDemo />}
      <div className="mx-auto max-w-2xl px-5 py-8 sm:py-12">
        <Link
          href={`/${negocio.slug}`}
          className="text-sm font-semibold text-(--n-texto)/60 hover:text-(--n-texto)"
        >
          ← {negocio.nombre}
        </Link>
        <div className="mt-6">
          {servicios.length === 0 ? (
            <p className="rounded-2xl border border-(--n-texto)/10 bg-(--n-tarjeta) p-6">
              Este negocio todavía no tiene servicios para reservar.
            </p>
          ) : (
            <ReservaFlow
              negocio={{
                id: negocio.id,
                slug: negocio.slug,
                nombre: negocio.nombre,
                timezone: negocio.timezone,
                ventana_dias: negocio.ventana_dias,
                direccion: negocio.direccion,
              }}
              servicios={servicios}
              profesionales={profesionales}
              vocabulario={vocabularioDe(tema.rubro)}
              turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null}
            />
          )}
        </div>
      </div>
    </div>
  );
}
