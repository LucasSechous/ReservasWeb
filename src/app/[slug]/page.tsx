import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BannerDemo } from "@/components/banner-demo";
import { FondoMovil } from "@/components/fondo-movil";
import { Galeria } from "@/components/galeria";
import { HeroTitle } from "@/components/hero-title";
import { LandingEditorial } from "@/components/landing-editorial";
import { LandingRetro } from "@/components/landing-retro";
import { Marquee } from "@/components/marquee";
import { Reveal } from "@/components/reveal";
import {
  formatoDuracion,
  formatoPrecio,
  getNegocio,
  getProfesionales,
  getServicios,
} from "@/lib/negocios";
import { getTema, temaStyle } from "@/lib/tema";

const boton =
  "group inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-accent px-8 text-base font-bold text-accent-ink transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_40px_-8px_var(--color-accent)] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent";

const pasos = [
  { titulo: "Elegís el servicio", texto: "Mirá la lista y quedate con el que necesitás." },
  { titulo: "Elegís día y horario", texto: "Solo ves los horarios que de verdad están libres." },
  { titulo: "Listo, tenés turno", texto: "Tu lugar queda reservado al instante." },
];

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

type Cta = { href: string; texto: string; externo: boolean };

// Botón de llamado a la acción: reserva en el sitio, o WhatsApp en una landing sin reservas.
function BotonCta({ cta, className, children }: { cta: Cta; className: string; children?: React.ReactNode }) {
  return cta.externo ? (
    <a href={cta.href} target="_blank" rel="noopener noreferrer" className={className}>
      {children ?? cta.texto}
    </a>
  ) : (
    <Link href={cta.href} className={className}>
      {children ?? cta.texto}
    </Link>
  );
}

// Tarjeta de servicio: enlace a la reserva, o caja común si el negocio no recibe reservas.
function Tarjeta({ href, className, children }: { href: string | null; className: string; children: React.ReactNode }) {
  return href ? (
    <Link href={href} className={className}>
      {children}
    </Link>
  ) : (
    <div className={className}>{children}</div>
  );
}

function Flecha() {
  return (
    <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">
      →
    </span>
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
  const whatsapp = negocio.telefono ? whatsappDe(negocio.telefono) : null;
  const mapa = negocio.direccion
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(negocio.direccion)}`
    : null;
  const reservarHref = `/${negocio.slug}/reservar`;
  const conReservas = tema.reservas !== false;
  const cta: Cta | null = conReservas
    ? { href: reservarHref, texto: "Reservar turno", externo: false }
    : whatsapp
      ? { href: whatsapp, texto: "Escribinos por WhatsApp", externo: true }
      : null;
  if (tema.estilo === "retro") {
    return (
      <LandingRetro
        negocio={negocio}
        servicios={servicios}
        profesionales={profesionales}
        tema={tema}
        cta={cta}
        whatsapp={whatsapp}
        mapa={mapa}
        reservarHref={reservarHref}
      />
    );
  }
  if (tema.estilo === "editorial") {
    return (
      <LandingEditorial
        negocio={negocio}
        servicios={servicios}
        profesionales={profesionales}
        tema={tema}
        cta={cta}
        whatsapp={whatsapp}
        mapa={mapa}
        reservarHref={reservarHref}
      />
    );
  }
  const cinta = servicios.map((s) => s.nombre.toUpperCase());
  const hayContacto = negocio.direccion || negocio.telefono || negocio.email;

  return (
    <div
      style={temaStyle(tema)}
      className="min-h-screen overflow-x-clip bg-(--n-fondo) pb-28 text-(--n-texto) selection:bg-(--n-acento) selection:text-(--n-acento-tinta) sm:pb-0"
    >
      <title>{conReservas ? `${negocio.nombre} · Reservá tu turno` : negocio.nombre}</title>
      {tema.demo && <BannerDemo />}

      <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
        <span className="flex items-center gap-3 font-display text-xl font-extrabold tracking-tight">
          {tema.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tema.logo} alt="" className="size-10" />
          )}
          {negocio.nombre}
        </span>
        {cta && (
          <BotonCta
            cta={cta}
            className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold transition-colors hover:border-accent hover:text-accent"
          >
            {conReservas ? "Reservar" : "Escribinos"}
          </BotonCta>
        )}
      </header>

      <main>
        <section className="relative isolate overflow-hidden">
          <FondoMovil video={tema.video} imagen={tema.portada} />
          {tema.logo && (
            <Reveal delay={0.5} y={30} className="pointer-events-none absolute right-8 top-16 hidden lg:block xl:right-20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={tema.logo} alt="" className="size-72 animate-float drop-shadow-[0_20px_60px_rgba(0,0,0,0.5)] xl:size-80" />
            </Reveal>
          )}
          <div className={`mx-auto max-w-6xl px-5 pb-20 pt-8 lg:pt-16 ${tema.logo ? "lg:pr-80" : ""}`}>
            <Reveal y={12}>
              <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white/75">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping-soft rounded-full bg-accent" />
                  <span className="relative inline-flex size-2 rounded-full bg-accent" />
                </span>
                {tema.etiqueta ?? "Reservas online"}
                {negocio.direccion ? ` · ${negocio.direccion}` : ""}
              </p>
            </Reveal>
            <HeroTitle lineas={[{ texto: negocio.nombre }, { texto: tema.lema, acento: true }]} />
            <Reveal delay={0.9} className="mt-8 max-w-xl">
              <p className="text-lg text-white/70">{tema.intro}</p>
            </Reveal>
            <Reveal delay={1.05} className="mt-9">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                {cta && (
                  <BotonCta cta={cta} className={boton}>
                    {cta.texto} <Flecha />
                  </BotonCta>
                )}
                <ul className="flex flex-wrap gap-2 text-sm text-white/70">
                  {conReservas && servicios.length > 0 && (
                    <li className="rounded-full border border-white/15 px-4 py-2">
                      {servicios.length} servicios
                    </li>
                  )}
                  {conReservas && profesionales.length > 0 && (
                    <li className="rounded-full border border-white/15 px-4 py-2">
                      {profesionales.length === 1 ? "1 profesional" : `${profesionales.length} profesionales`}
                    </li>
                  )}
                  {conReservas && (
                    <li className="rounded-full border border-white/15 px-4 py-2">Confirmación al instante</li>
                  )}
                </ul>
              </div>
            </Reveal>
          </div>
        </section>

        {cinta.length > 0 && (
          <section aria-label="Servicios" className="border-y border-white/10 bg-ink-2 py-5">
            <Marquee
              items={cinta.length < 4 ? [...cinta, ...cinta] : cinta}
              className="font-display text-2xl font-extrabold tracking-tight text-white/85 sm:text-4xl"
            />
          </section>
        )}

        {servicios.length > 0 && (
          <section aria-labelledby="servicios" className="mx-auto max-w-6xl px-5 py-24">
            <Reveal>
              <h2
                id="servicios"
                className="font-display text-4xl font-extrabold tracking-tight sm:text-6xl"
              >
                {tema.tituloServicios ?? "Servicios"}
              </h2>
              <p className="mt-4 max-w-xl text-lg text-white/65">
                {tema.subtituloServicios ?? "Tocá el que quieras y elegí tu horario."}
              </p>
            </Reveal>
            <ul className="mt-12 grid gap-5 sm:grid-cols-2">
              {servicios.map((s, i) => (
                <li key={s.id}>
                  <Reveal delay={(i % 2) * 0.1}>
                    <Tarjeta
                      href={conReservas ? reservarHref : null}
                      className="group flex h-full flex-col rounded-3xl border border-white/10 bg-ink-2 p-7 transition-all duration-300 hover:-translate-y-1.5 hover:border-accent/50 hover:shadow-[0_20px_60px_-24px_var(--color-accent)]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <span
                          aria-hidden
                          className="font-display text-6xl font-extrabold leading-none text-transparent [-webkit-text-stroke:1.5px_var(--color-accent)]"
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="rounded-full bg-accent px-4 py-1.5 text-sm font-bold text-accent-ink">
                          {formatoPrecio(s.precio)}
                        </span>
                      </div>
                      <h3 className="mt-6 font-display text-2xl font-bold">{s.nombre}</h3>
                      {s.descripcion && <p className="mt-2 text-white/65">{s.descripcion}</p>}
                      {conReservas && (
                        <p className="mt-auto flex items-center justify-between pt-6 text-sm font-semibold uppercase tracking-wider text-white/50">
                          <span>{formatoDuracion(s.duracion_minutos)}</span>
                          <span className="text-accent">
                            Reservar <Flecha />
                          </span>
                        </p>
                      )}
                    </Tarjeta>
                  </Reveal>
                </li>
              ))}
            </ul>
          </section>
        )}

        {tema.galeria && tema.galeria.length > 0 && (
          <section aria-labelledby="galeria" className="mx-auto max-w-6xl px-5 pb-24">
            <Reveal>
              <h2
                id="galeria"
                className="font-display text-4xl font-extrabold tracking-tight sm:text-6xl"
              >
                Galería
              </h2>
            </Reveal>
            <div className="mt-12">
              <Galeria fotos={tema.galeria} />
            </div>
          </section>
        )}

        {profesionales.length > 0 && (
          <section aria-labelledby="equipo" className="relative isolate overflow-hidden bg-ink-2 py-24">
            {tema.fondoEquipo && (
              <div aria-hidden className="absolute inset-0 -z-10">
                <Image
                  src={tema.fondoEquipo}
                  alt=""
                  fill
                  sizes="100vw"
                  className="object-cover"
                  style={{ objectPosition: tema.fondoEquipoPosicion }}
                />
                <div className="absolute inset-0 bg-(--n-fondo)/55" />
                <div className="absolute inset-0 bg-gradient-to-b from-(--n-fondo)/90 via-transparent to-(--n-fondo)/90" />
              </div>
            )}
            <div className="mx-auto max-w-6xl px-5">
              <Reveal>
                <h2
                  id="equipo"
                  className="font-display text-4xl font-extrabold tracking-tight sm:text-6xl"
                >
                  El equipo
                </h2>
              </Reveal>
              <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {profesionales.map((p, i) => (
                  <li key={p.id}>
                    <Reveal delay={i * 0.08}>
                      <div className="flex items-center gap-5 rounded-3xl border border-white/10 bg-(--n-fondo)/70 p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-white/30">
                        <span
                          aria-hidden
                          className="flex size-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-violeta font-display text-2xl font-extrabold text-accent-ink"
                        >
                          {p.nombre.charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <p className="font-display text-xl font-bold">{p.nombre}</p>
                          <p className="text-sm text-white/50">Profesional</p>
                        </div>
                      </div>
                    </Reveal>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {conReservas && (
        <section aria-labelledby="como" className="mx-auto max-w-6xl px-5 py-24">
          <Reveal>
            <h2 id="como" className="font-display text-4xl font-extrabold tracking-tight sm:text-6xl">
              Reservar es así de fácil
            </h2>
          </Reveal>
          <ol className="mt-14 grid gap-10 md:grid-cols-3">
            {pasos.map((paso, i) => (
              <li key={paso.titulo}>
                <Reveal delay={i * 0.12}>
                  <span
                    aria-hidden
                    className="font-display text-8xl font-extrabold leading-none text-transparent [-webkit-text-stroke:1.5px_var(--color-accent)]"
                  >
                    {i + 1}
                  </span>
                  <h3 className="mt-4 font-display text-2xl font-bold">{paso.titulo}</h3>
                  <p className="mt-2 text-white/65">{paso.texto}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </section>
        )}

        {hayContacto && (
          <section aria-labelledby="contacto" className="bg-ink-2 py-24">
            <div className="mx-auto max-w-6xl px-5">
              <Reveal>
                <h2
                  id="contacto"
                  className="font-display text-4xl font-extrabold tracking-tight sm:text-6xl"
                >
                  Dónde estamos
                </h2>
              </Reveal>
              <Reveal delay={0.1}>
                <ul className="mt-10 grid gap-5 md:grid-cols-3">
                  {negocio.direccion && (
                    <li className="rounded-3xl border border-white/10 bg-(--n-fondo) p-7">
                      <p className="text-sm font-semibold uppercase tracking-wider text-white/45">
                        Dirección
                      </p>
                      <p className="mt-3 text-xl font-bold">
                        {mapa ? (
                          <a
                            href={mapa}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline decoration-accent underline-offset-4"
                          >
                            {negocio.direccion}
                          </a>
                        ) : (
                          negocio.direccion
                        )}
                      </p>
                    </li>
                  )}
                  {negocio.telefono && (
                    <li className="rounded-3xl border border-white/10 bg-(--n-fondo) p-7">
                      <p className="text-sm font-semibold uppercase tracking-wider text-white/45">
                        WhatsApp
                      </p>
                      <p className="mt-3 text-xl font-bold">
                        {whatsapp ? (
                          <a
                            href={whatsapp}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline decoration-accent underline-offset-4"
                          >
                            {negocio.telefono}
                          </a>
                        ) : (
                          negocio.telefono
                        )}
                      </p>
                    </li>
                  )}
                  {negocio.email && (
                    <li className="rounded-3xl border border-white/10 bg-(--n-fondo) p-7">
                      <p className="text-sm font-semibold uppercase tracking-wider text-white/45">
                        Mail
                      </p>
                      <p className="mt-3 break-all text-xl font-bold">
                        <a
                          href={`mailto:${negocio.email}`}
                          className="underline decoration-accent underline-offset-4"
                        >
                          {negocio.email}
                        </a>
                      </p>
                    </li>
                  )}
                </ul>
              </Reveal>
            </div>
          </section>
        )}

        <section className="relative isolate overflow-hidden py-28">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 -z-10 size-[40rem] -translate-x-1/2 -translate-y-1/2 animate-float-slow rounded-full bg-accent/15 blur-[130px]"
          />
          <div className="mx-auto max-w-6xl px-5 text-center">
            <Reveal>
              <h2 className="mx-auto max-w-4xl font-display text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-7xl">
                {conReservas ? (
                  <>
                    ¿Te reservamos <span className="text-accent">un turno?</span>
                  </>
                ) : (
                  <>
                    ¿Te <span className="text-accent">esperamos?</span>
                  </>
                )}
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-lg text-white/65">
                {conReservas ? "Elegí tu horario en menos de un minuto." : "Escribinos por cualquier consulta o pasá a visitarnos."}
              </p>
              {cta && (
                <div className="mt-10 flex justify-center">
                  <BotonCta cta={cta} className={boton}>
                    {cta.texto} <Flecha />
                  </BotonCta>
                </div>
              )}
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-5 pb-12 pt-4 text-sm text-white/40">
        <p>
          {conReservas ? "Reservas con" : "Web hecha con"}{" "}
          <Link href="/" className="underline hover:text-white">
            ReservasWeb
          </Link>{" "}
          ·{" "}
          <Link href="/privacidad" className="underline hover:text-white">
            Privacidad
          </Link>
        </p>
      </footer>

      {cta && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-(--n-fondo)/90 px-5 py-3 backdrop-blur sm:hidden">
          <BotonCta
            cta={cta}
            className="flex min-h-12 w-full items-center justify-center rounded-full bg-(--n-acento) font-bold text-(--n-acento-tinta)"
          />
        </div>
      )}
    </div>
  );
}
