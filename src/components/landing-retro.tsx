import Image from "next/image";
import Link from "next/link";
import { BannerDemo } from "@/components/banner-demo";
import { BotonCta, type Cta } from "@/components/boton-cta";
import { Marquee } from "@/components/marquee";
import { Reveal } from "@/components/reveal";
import { type Negocio, type Profesional, type Servicio, formatoPrecio } from "@/lib/negocios";
import { type Tema, temaStyle } from "@/lib/tema";

// Landing con estilo retro: papel crema, tinta de imprenta, letras de cartel y marcos con sombra dura.
// Es una alternativa completa a la landing oscura de page.tsx; se elige con `estilo: "retro"` en el tema.
// Pensada para landings simples (cafeterías, bares, panaderías). La reserva online sigue usando
// el flujo oscuro de /[slug]/reservar, que no está adaptado a este estilo claro.

type Props = {
  negocio: Negocio;
  servicios: Servicio[];
  profesionales: Profesional[];
  tema: Tema;
  cta: Cta | null;
  whatsapp: string | null;
  mapa: string | null;
  reservarHref: string;
};

const TINTA = "var(--n-texto)";

// Textura de papel: ruido fino de baja opacidad, sin imagen externa.
const PAPEL = `url("data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .23 0 0 0 0 .13 0 0 0 0 .07 0 0 0 .9 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>",
)}")`;

const RAYOS =
  "repeating-conic-gradient(from 0deg at 76% 42%, color-mix(in srgb, var(--color-violeta) 22%, transparent) 0deg 7deg, transparent 7deg 14deg)";
const AJEDREZ = `repeating-conic-gradient(${TINTA} 0% 25%, var(--n-fondo) 0% 50%) 0 0 / 20px 20px`;
const FRANJAS =
  "linear-gradient(to bottom, var(--n-acento) 0 34%, var(--color-violeta) 34% 67%, var(--n-detalle) 67% 100%)";

const FOTO_VIEJA = "[filter:sepia(0.35)_saturate(1.1)_contrast(1.05)]";

const boton =
  "inline-flex min-h-13 items-center justify-center gap-2 rounded-sm border-2 border-(--n-texto) bg-(--n-acento) px-8 retro-mono text-base font-bold uppercase tracking-wider text-(--n-acento-tinta) shadow-[5px_5px_0_var(--n-texto)] transition hover:-translate-y-0.5 hover:shadow-[7px_7px_0_var(--n-texto)] active:translate-x-1 active:translate-y-1 active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--n-texto)";
const botonClaro =
  "inline-flex min-h-13 items-center justify-center gap-2 rounded-sm border-2 border-(--n-texto) bg-(--n-fondo) px-8 retro-mono text-base font-bold uppercase tracking-wider text-(--n-texto) shadow-[5px_5px_0_var(--n-texto)] transition hover:-translate-y-0.5 hover:shadow-[7px_7px_0_var(--n-texto)] active:translate-x-1 active:translate-y-1 active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--n-texto)";

function Titulo({
  id,
  children,
  className = "",
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      id={id}
      className={`retro-titulo text-4xl leading-tight text-(--n-texto) sm:text-6xl ${className}`}
      style={{ textShadow: "3px 3px 0 var(--color-violeta)" }}
    >
      {children}
    </h2>
  );
}

export function LandingRetro({
  negocio,
  servicios,
  profesionales,
  tema,
  cta,
  whatsapp,
  mapa,
  reservarHref,
}: Props) {
  const conReservas = tema.reservas !== false;
  const cinta = servicios.map((s) => s.nombre.toUpperCase());
  const hayContacto = negocio.direccion || negocio.telefono || negocio.email;
  const giros = ["-rotate-2", "rotate-1", "-rotate-1"];

  return (
    <div
      style={temaStyle(tema)}
      className="relative min-h-screen overflow-x-clip bg-(--n-fondo) pb-28 retro-texto text-lg text-(--n-texto) selection:bg-(--n-acento) selection:text-(--n-acento-tinta) sm:pb-0"
    >
      <title>{conReservas ? `${negocio.nombre} · Reservá tu turno` : negocio.nombre}</title>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-30 opacity-[0.09] mix-blend-multiply"
        style={{ backgroundImage: PAPEL }}
      />
      {tema.demo && <BannerDemo />}
      <div aria-hidden className="h-3 w-full" style={{ background: FRANJAS }} />

      <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
        <span className="flex items-center gap-3 retro-titulo text-2xl">
          {tema.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tema.logo} alt="" className="size-11" />
          )}
          {negocio.nombre}
        </span>
        {cta && (
          <BotonCta
            cta={cta}
            className="rounded-sm border-2 border-(--n-texto) px-4 py-2 retro-mono text-sm font-bold uppercase tracking-wider shadow-[3px_3px_0_var(--n-texto)] transition hover:-translate-y-0.5 hover:bg-(--n-acento) hover:text-(--n-acento-tinta)"
          >
            {conReservas ? "Reservar" : "Escribinos"}
          </BotonCta>
        )}
      </header>

      <main>
        <section className="relative isolate overflow-hidden border-b-4 border-(--n-texto)">
          <div aria-hidden className="absolute inset-0 -z-10" style={{ background: RAYOS }} />
          <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-10 lg:grid-cols-[1.1fr_0.9fr] lg:pb-24 lg:pt-16">
            <div>
              <Reveal y={12}>
                <p className="inline-flex max-w-full items-center gap-2 border-2 border-(--n-texto) bg-(--color-violeta) px-3 py-1 retro-mono text-xs font-bold uppercase tracking-[0.18em] text-(--n-texto)">
                  <span aria-hidden>★</span>
                  {tema.etiqueta ?? "Reservas online"}
                  {negocio.direccion ? ` · ${negocio.direccion}` : ""}
                </p>
              </Reveal>
              <Reveal delay={0.1} y={20}>
                <h1
                  className="mt-7 retro-titulo text-[3.3rem] leading-[1.02] sm:text-7xl lg:text-8xl"
                  style={{ textShadow: "4px 4px 0 var(--color-violeta)" }}
                >
                  {negocio.nombre}
                </h1>
                <p className="mt-4 inline-block -rotate-2 retro-titulo text-3xl text-(--n-acento) sm:text-5xl">
                  {tema.lema}
                </p>
              </Reveal>
              <Reveal delay={0.25} className="mt-8 max-w-xl">
                <p className="text-xl leading-relaxed text-(--n-texto)/80">{tema.intro}</p>
              </Reveal>
              {cta && (
                <Reveal delay={0.35} className="mt-10">
                  <BotonCta cta={cta} className={boton}>
                    {cta.texto} <span aria-hidden>→</span>
                  </BotonCta>
                </Reveal>
              )}
            </div>

            {tema.portada && (
              <Reveal delay={0.2} y={30} className="relative mx-auto w-full max-w-md">
                <div className="relative rotate-2 border-4 border-(--n-texto) bg-(--n-tarjeta) p-3 pb-12 shadow-[10px_10px_0_var(--n-texto)]">
                  <div className="relative aspect-[4/5] overflow-hidden border-2 border-(--n-texto)/30">
                    <Image
                      src={tema.portada}
                      alt=""
                      fill
                      priority
                      sizes="(min-width: 1024px) 28rem, 90vw"
                      className={`object-cover ${FOTO_VIEJA}`}
                    />
                  </div>
                  <p className="absolute inset-x-0 bottom-3 truncate px-4 text-center retro-mono text-sm font-bold uppercase tracking-wider">
                    {negocio.nombre}
                  </p>
                </div>
                {tema.logo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={tema.logo}
                    alt=""
                    className="absolute -left-5 -top-9 size-28 -rotate-12 drop-shadow-[4px_4px_0_var(--n-texto)] sm:-left-9 sm:size-32"
                  />
                )}
              </Reveal>
            )}
          </div>
        </section>

        <div aria-hidden className="h-5 w-full" style={{ background: AJEDREZ }} />

        {cinta.length > 0 && (
          <section
            aria-label="Servicios"
            className="border-y-4 border-(--n-texto) bg-(--color-violeta) py-4"
          >
            <Marquee
              items={cinta.length < 4 ? [...cinta, ...cinta] : cinta}
              className="retro-titulo text-2xl text-(--n-texto) sm:text-4xl"
            />
          </section>
        )}

        {servicios.length > 0 && (
          <section aria-labelledby="servicios" className="mx-auto max-w-5xl px-5 py-24">
            <Reveal className="text-center">
              <p aria-hidden className="retro-mono text-xl tracking-[0.4em] text-(--n-acento)">
                ★ ★ ★
              </p>
              <Titulo id="servicios" className="mt-2">
                {tema.tituloServicios ?? "Servicios"}
              </Titulo>
              <p className="mx-auto mt-5 max-w-xl text-xl text-(--n-texto)/75">
                {tema.subtituloServicios ?? "Tocá el que quieras y elegí tu horario."}
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="mt-12 border-4 border-double border-(--n-texto) bg-(--n-tarjeta) p-7 shadow-[10px_10px_0_var(--n-texto)] sm:p-12">
                <ul className="grid gap-x-14 gap-y-9 md:grid-cols-2">
                  {servicios.map((s) => (
                    <li key={s.id}>
                      <div className="flex items-baseline gap-3">
                        <h3 className="min-w-0 text-lg font-bold uppercase tracking-wide sm:text-2xl">
                          {conReservas ? (
                            <Link href={reservarHref} className="hover:text-(--n-acento)">
                              {s.nombre}
                            </Link>
                          ) : (
                            s.nombre
                          )}
                        </h3>
                        <span
                          aria-hidden
                          className="mb-1.5 flex-1 border-b-[3px] border-dotted border-(--n-texto)/45"
                        />
                        <span className="retro-mono shrink-0 whitespace-nowrap text-xl font-bold text-(--n-acento) sm:text-2xl">
                          {formatoPrecio(s.precio)}
                        </span>
                      </div>
                      {s.descripcion && (
                        <p className="mt-1.5 text-lg italic text-(--n-texto)/70">{s.descripcion}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </section>
        )}

        {tema.galeria && tema.galeria.length > 0 && (
          <section
            aria-labelledby="galeria"
            className="border-y-4 border-(--n-texto) bg-(--n-detalle) py-24"
          >
            <div className="mx-auto max-w-6xl px-5">
              <Reveal>
                <h2
                  id="galeria"
                  className="retro-titulo text-4xl leading-tight text-(--n-fondo) sm:text-6xl"
                  style={{ textShadow: "3px 3px 0 var(--n-texto)" }}
                >
                  Un vistazo
                </h2>
              </Reveal>
              <ul className="mt-14 grid gap-12 sm:grid-cols-3 sm:gap-8">
                {tema.galeria.map((foto, i) => (
                  <li key={foto.src}>
                    <Reveal delay={i * 0.1}>
                      <figure
                        className={`border-2 border-(--n-texto) bg-(--n-tarjeta) p-3 pb-4 shadow-[7px_7px_0_var(--n-texto)] ${giros[i % giros.length]}`}
                      >
                        <div className="relative aspect-square overflow-hidden border-2 border-(--n-texto)/25">
                          <Image
                            src={foto.src}
                            alt={foto.alt}
                            fill
                            sizes="(min-width: 640px) 30vw, 90vw"
                            className={`object-cover ${FOTO_VIEJA}`}
                          />
                        </div>
                        <figcaption className="mt-3 retro-mono text-xs leading-snug text-(--n-texto)/75">
                          {foto.alt}
                        </figcaption>
                      </figure>
                    </Reveal>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {profesionales.length > 0 && (
          <section aria-labelledby="equipo" className="mx-auto max-w-5xl px-5 py-24">
            <Reveal>
              <Titulo id="equipo">Quiénes te atienden</Titulo>
            </Reveal>
            <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {profesionales.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-5 border-2 border-(--n-texto) bg-(--n-tarjeta) p-5 shadow-[5px_5px_0_var(--n-texto)]"
                >
                  <span
                    aria-hidden
                    className="flex size-14 shrink-0 items-center justify-center rounded-full border-2 border-(--n-texto) bg-(--n-acento) retro-titulo text-2xl text-(--n-acento-tinta)"
                  >
                    {p.nombre.charAt(0).toUpperCase()}
                  </span>
                  <p className="text-xl font-bold">{p.nombre}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {hayContacto && (
          <section aria-labelledby="contacto" className="mx-auto max-w-5xl px-5 py-24">
            <Reveal>
              <Titulo id="contacto">Dónde estamos</Titulo>
            </Reveal>
            <Reveal delay={0.1}>
              <ul className="mt-12 grid gap-6 md:grid-cols-3">
                {negocio.direccion && (
                  <li className="border-2 border-dashed border-(--n-texto) bg-(--n-tarjeta) p-6">
                    <p className="retro-mono text-xs font-bold uppercase tracking-[0.2em] text-(--n-texto)/60">
                      Dirección
                    </p>
                    <p className="mt-3 text-2xl font-bold leading-snug">
                      {mapa ? (
                        <a
                          href={mapa}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline decoration-(--n-acento) decoration-4 underline-offset-4"
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
                  <li className="border-2 border-dashed border-(--n-texto) bg-(--n-tarjeta) p-6">
                    <p className="retro-mono text-xs font-bold uppercase tracking-[0.2em] text-(--n-texto)/60">
                      WhatsApp
                    </p>
                    <p className="mt-3 text-2xl font-bold leading-snug">
                      {whatsapp ? (
                        <a
                          href={whatsapp}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline decoration-(--n-acento) decoration-4 underline-offset-4"
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
                  <li className="border-2 border-dashed border-(--n-texto) bg-(--n-tarjeta) p-6">
                    <p className="retro-mono text-xs font-bold uppercase tracking-[0.2em] text-(--n-texto)/60">
                      Mail
                    </p>
                    <p className="mt-3 break-all text-2xl font-bold leading-snug">
                      <a
                        href={`mailto:${negocio.email}`}
                        className="underline decoration-(--n-acento) decoration-4 underline-offset-4"
                      >
                        {negocio.email}
                      </a>
                    </p>
                  </li>
                )}
              </ul>
            </Reveal>
          </section>
        )}

        <section className="px-5 pb-24">
          <Reveal>
            <div className="mx-auto max-w-4xl border-4 border-(--n-texto) bg-(--n-acento) p-10 text-center text-(--n-acento-tinta) shadow-[10px_10px_0_var(--n-texto)] sm:p-16">
              <h2 className="retro-titulo text-5xl leading-tight sm:text-7xl">
                {conReservas ? "¿Te reservamos un turno?" : "¿Te esperamos?"}
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-xl">
                {conReservas
                  ? "Elegí tu horario en menos de un minuto."
                  : "Escribinos por cualquier consulta o pasá a visitarnos."}
              </p>
              {cta && (
                <div className="mt-9 flex justify-center">
                  <BotonCta cta={cta} className={botonClaro}>
                    {cta.texto} <span aria-hidden>→</span>
                  </BotonCta>
                </div>
              )}
            </div>
          </Reveal>
        </section>
      </main>

      <div aria-hidden className="h-5 w-full" style={{ background: AJEDREZ }} />
      <footer className="mx-auto w-full max-w-6xl px-5 pb-12 pt-8 retro-mono text-sm text-(--n-texto)/70">
        <p>
          {conReservas ? "Reservas con" : "Web hecha con"}{" "}
          <Link href="/" className="underline hover:text-(--n-acento)">
            ReservasWeb
          </Link>{" "}
          ·{" "}
          <Link href="/privacidad" className="underline hover:text-(--n-acento)">
            Privacidad
          </Link>
        </p>
      </footer>

      {cta && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t-4 border-(--n-texto) bg-(--n-fondo) px-5 py-3 sm:hidden">
          <BotonCta cta={cta} className={`${boton} w-full`} />
        </div>
      )}
    </div>
  );
}
