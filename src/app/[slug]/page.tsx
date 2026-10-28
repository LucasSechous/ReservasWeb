import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BannerDemo } from "@/components/banner-demo";
import { Reveal } from "@/components/reveal";
import {
  formatoDuracion,
  formatoPrecio,
  getNegocio,
  getProfesionales,
  getServicios,
} from "@/lib/negocios";
import { getTema, temaStyle } from "@/lib/tema";

// Landing de cada negocio. Se pasa la promesa de params hacia abajo para que la estructura
// de la página quede en el shell estático y solo los datos del negocio lleguen en streaming.
export default function LandingNegocio({ params }: PageProps<"/[slug]">) {
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

function whatsappDe(telefono: string): string | null {
  const digitos = telefono.replace(/\D/g, "");
  if (digitos.length < 8) return null;
  // Número uruguayo escrito sin prefijo (099 123 456): se le agrega el 598.
  const conPais = telefono.trim().startsWith("+") || digitos.startsWith("598")
    ? digitos
    : `598${digitos.replace(/^0/, "")}`;
  return `https://wa.me/${conPais}`;
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
  const whatsapp = negocio.telefono ? whatsappDe(negocio.telefono) : null;
  const mapa = negocio.direccion
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(negocio.direccion)}`
    : null;
  const reservarHref = `/${negocio.slug}/reservar`;

  return (
    <div
      style={temaStyle(tema)}
      className="min-h-screen bg-(--n-fondo) pb-28 text-(--n-texto) selection:bg-(--n-acento) selection:text-(--n-acento-tinta)"
    >
      <title>{`${negocio.nombre} · Reservá tu turno`}</title>
      {tema.demo && <BannerDemo />}

      <div
        style={
          tema.portada
            ? {
                backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.55), var(--n-fondo)), url(${tema.portada})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
      <header className="mx-auto max-w-3xl px-5 pb-10 pt-16 sm:pt-24">
        <Reveal y={14}>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-(--n-acento)">
            Reservas online
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <h1 className="mt-4 text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-7xl">
            {negocio.nombre}
          </h1>
        </Reveal>
        {negocio.direccion && (
          <Reveal delay={0.2}>
            <p className="mt-4 text-lg text-white/65">{negocio.direccion}</p>
          </Reveal>
        )}
        <Reveal delay={0.3} className="mt-8">
          <Link
            href={reservarHref}
            className="inline-flex min-h-13 items-center justify-center rounded-full bg-(--n-acento) px-8 text-lg font-bold text-(--n-acento-tinta) transition hover:brightness-110"
          >
            Reservar turno
          </Link>
        </Reveal>
      </header>
      </div>

      <main className="mx-auto max-w-3xl space-y-16 px-5">
        {servicios.length > 0 && (
          <section aria-labelledby="servicios">
            <Reveal>
              <h2 id="servicios" className="text-3xl font-extrabold">
                Servicios
              </h2>
            </Reveal>
            <ul className="mt-6 divide-y divide-white/10 overflow-hidden rounded-3xl border border-white/10 bg-(--n-tarjeta)">
              {servicios.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-4 p-5">
                  <div>
                    <p className="font-bold">{s.nombre}</p>
                    <p className="text-sm text-white/55">
                      {formatoDuracion(s.duracion_minutos)}
                      {s.descripcion ? ` · ${s.descripcion}` : ""}
                    </p>
                  </div>
                  <p className="shrink-0 text-lg font-extrabold">{formatoPrecio(s.precio)}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {profesionales.length > 0 && (
          <section aria-labelledby="equipo">
            <Reveal>
              <h2 id="equipo" className="text-3xl font-extrabold">
                El equipo
              </h2>
            </Reveal>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {profesionales.map((p, i) => (
                <li key={p.id}>
                  <Reveal delay={i * 0.08}>
                    <div className="flex items-center gap-4 rounded-3xl border border-white/10 bg-(--n-tarjeta) p-5">
                      <span
                        aria-hidden
                        className="flex size-14 items-center justify-center rounded-full bg-(--n-acento) text-xl font-extrabold text-(--n-acento-tinta)"
                      >
                        {p.nombre.charAt(0).toUpperCase()}
                      </span>
                      <p className="text-lg font-bold">{p.nombre}</p>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ul>
          </section>
        )}

        {(negocio.direccion || negocio.telefono || negocio.email) && (
          <section aria-labelledby="contacto">
            <Reveal>
              <h2 id="contacto" className="text-3xl font-extrabold">
                Dónde estamos
              </h2>
              <div className="mt-6 space-y-2 text-white/80">
                {negocio.direccion && (
                  <p>
                    {mapa ? (
                      <a href={mapa} target="_blank" rel="noopener noreferrer" className="underline">
                        {negocio.direccion}
                      </a>
                    ) : (
                      negocio.direccion
                    )}
                  </p>
                )}
                {negocio.telefono && (
                  <p>
                    {whatsapp ? (
                      <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="underline">
                        {negocio.telefono}
                      </a>
                    ) : (
                      negocio.telefono
                    )}
                  </p>
                )}
                {negocio.email && (
                  <p>
                    <a href={`mailto:${negocio.email}`} className="underline">
                      {negocio.email}
                    </a>
                  </p>
                )}
              </div>
            </Reveal>
          </section>
        )}
      </main>

      <footer className="mx-auto mt-20 max-w-3xl px-5 text-sm text-white/40">
        <p>
          Reservas con{" "}
          <Link href="/" className="underline hover:text-white">
            ReservasWeb
          </Link>{" "}
          ·{" "}
          <Link href="/privacidad" className="underline hover:text-white">
            Privacidad
          </Link>
        </p>
      </footer>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-(--n-fondo)/90 px-5 py-3 backdrop-blur sm:hidden">
        <Link
          href={reservarHref}
          className="flex min-h-12 w-full items-center justify-center rounded-full bg-(--n-acento) font-bold text-(--n-acento-tinta)"
        >
          Reservar turno
        </Link>
      </div>
    </div>
  );
}
