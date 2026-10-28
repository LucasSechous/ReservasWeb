import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BannerDemo } from "@/components/banner-demo";
import { getNegocio, getProfesionales, getServicios } from "@/lib/negocios";
import { getTema, temaStyle } from "@/lib/tema";
import { ReservaFlow } from "./reserva-flow";

export default function Reservar({ params }: PageProps<"/[slug]/reservar">) {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center text-white/50">Cargando…</div>
      }
    >
      <Contenido params={params} />
    </Suspense>
  );
}

async function Contenido({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const negocio = await getNegocio(slug);
  if (!negocio) notFound();

  const [servicios, profesionales] = await Promise.all([
    getServicios(negocio.id),
    getProfesionales(negocio.id),
  ]);

  const tema = getTema(negocio.slug);

  return (
    <div
      style={temaStyle(tema)}
      className="min-h-screen bg-(--n-fondo) text-(--n-texto) selection:bg-(--n-acento) selection:text-(--n-acento-tinta)"
    >
      <title>{`Reservar · ${negocio.nombre}`}</title>
      {tema.demo && <BannerDemo />}
      <div className="mx-auto max-w-2xl px-5 py-8 sm:py-12">
        <Link
          href={`/${negocio.slug}`}
          className="text-sm font-semibold text-white/60 hover:text-white"
        >
          ← {negocio.nombre}
        </Link>
        <div className="mt-6">
          {servicios.length === 0 ? (
            <p className="rounded-2xl border border-white/10 bg-(--n-tarjeta) p-6">
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
              }}
              servicios={servicios}
              profesionales={profesionales}
              turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null}
            />
          )}
        </div>
      </div>
    </div>
  );
}
