import Image from "next/image";
import Link from "next/link";
import { BannerDemo } from "@/components/banner-demo";
import { BotonCta, type Cta } from "@/components/boton-cta";
import { Marquee } from "@/components/marquee";
import { Reveal } from "@/components/reveal";
import {
  type Negocio,
  type Profesional,
  type Servicio,
  formatoDuracion,
  formatoPrecio,
} from "@/lib/negocios";
import { type Tema, temaStyle } from "@/lib/tema";
import { cantidadDe, vocabularioDe } from "@/lib/vocabulario";

// Landing con estilo spa: crema y rosa empolvado, serif fina con itálicas, formas de arco y círculo,
// manchas de color que flotan despacio y tarjetas suaves. Pensada para estética, uñas, masajes y
// bienestar. Se elige con `estilo: "spa"` en el tema. Usa las letras del estilo editorial.

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

const pasos = [
  { titulo: "Elegís el tratamiento", texto: "Mirá la carta y quedate con el que necesitás." },
  { titulo: "Elegís día y horario", texto: "Solo ves los horarios que de verdad están libres." },
  { titulo: "Venís a relajarte", texto: "Tu lugar queda reservado al instante. Del resto nos ocupamos." },
];

const botonPrimario =
  "group inline-flex min-h-13 items-center justify-center gap-3 rounded-full bg-(--n-acento) px-8 text-sm font-medium uppercase tracking-[0.2em] text-(--n-acento-tinta) shadow-[0_14px_34px_-14px_var(--n-acento)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-12px_var(--n-acento)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--n-acento)";
const botonLinea =
  "inline-flex items-center justify-center rounded-full border border-(--n-texto)/25 px-5 py-2.5 text-xs font-medium uppercase tracking-[0.22em] transition-colors hover:border-(--n-acento) hover:bg-(--n-acento) hover:text-(--n-acento-tinta)";
const etiqueta = "flex items-center gap-3 text-xs font-medium uppercase tracking-[0.3em] text-(--n-acento)";

function Flecha() {
  return (
    <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">
      →
    </span>
  );
}

function Etiqueta({ children, centrada = false }: { children: React.ReactNode; centrada?: boolean }) {
  return (
    <p className={`${etiqueta} ${centrada ? "justify-center" : ""}`}>
      <span aria-hidden className="h-px w-8 bg-current" />
      {children}
      {centrada && <span aria-hidden className="h-px w-8 bg-current" />}
    </p>
  );
}

function Titulo({ id, children, className = "" }: { id?: string; children: React.ReactNode; className?: string }) {
  return (
    <h2
      id={id}
      className={`editorial-titulo mt-4 text-5xl font-light leading-[1.02] tracking-tight sm:text-7xl ${className}`}
    >
      {children}
    </h2>
  );
}

/** Sello redondo con texto que gira alrededor del logo. */
function Sello({ texto, logo }: { texto: string; logo?: string }) {
  return (
    <div className="relative flex size-32 items-center justify-center rounded-full bg-(--n-tarjeta) shadow-[0_18px_40px_-20px_rgba(0,0,0,0.35)] sm:size-36">
      <svg viewBox="0 0 100 100" aria-hidden className="absolute inset-0 size-full animate-[spin_28s_linear_infinite]">
        <defs>
          <path id="sello-circulo" d="M50 50m-38 0a38 38 0 1 1 76 0a38 38 0 1 1-76 0" />
        </defs>
        <text className="fill-(--n-texto) text-[8.4px] uppercase tracking-[0.32em]">
          <textPath href="#sello-circulo">{texto}</textPath>
        </text>
      </svg>
      {logo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt="" className="size-14" />
      )}
    </div>
  );
}

export function LandingSpa({
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
  const vocab = vocabularioDe(tema.rubro);
  const hayContacto = negocio.direccion || negocio.telefono || negocio.email;
  const galeria = tema.galeria ?? [];
  const fotoChica = galeria[1] ?? galeria[0];
  const fotoServicios = galeria[0] ?? (tema.portada ? { src: tema.portada, alt: tema.portadaAlt ?? "" } : null);
  const cinta = servicios.map((s) => s.nombre);
  const datos = [
    servicios.length > 0 ? `${servicios.length} ${conReservas ? "tratamientos" : "servicios"}` : null,
    conReservas && profesionales.length > 0 ? cantidadDe(profesionales.length, vocab, "profesional") : null,
    conReservas ? "Confirmación al instante" : null,
  ].filter((d): d is string => d !== null);

  return (
    <div
      style={temaStyle(tema)}
      className="editorial-texto relative isolate min-h-screen overflow-x-clip bg-(--n-fondo) pb-28 text-lg text-(--n-texto) selection:bg-(--n-acento) selection:text-(--n-acento-tinta) sm:pb-0"
    >
      {/* Manchas de color que flotan despacio detrás del encabezado y la portada. Van desde el borde de
          arriba de la página para que el desenfoque no quede cortado en línea recta. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[62rem] overflow-hidden">
        <div className="absolute -right-40 -top-24 size-[38rem] animate-drift-a rounded-full bg-(--color-violeta) opacity-70 blur-[110px]" />
        <div className="absolute -left-40 top-[28rem] size-[30rem] animate-drift-b rounded-full bg-(--n-detalle) opacity-20 blur-[120px]" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-b from-transparent to-(--n-fondo)" />
      </div>
      {tema.demo && <BannerDemo />}

      <header className="relative z-20">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-5 py-6">
          <span className="flex min-w-0 items-center gap-3 editorial-titulo text-2xl font-medium tracking-tight">
            {tema.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tema.logo} alt={`Logo de ${negocio.nombre}`} className="size-10 shrink-0" />
            )}
            <span className="truncate">{negocio.nombre}</span>
          </span>
          <nav aria-label="Secciones" className="hidden items-center gap-9 md:flex">
            {[
              servicios.length > 0 && ["#servicios", tema.tituloServicios ?? "Servicios"],
              profesionales.length > 0 && ["#equipo", "Equipo"],
              hayContacto && ["#contacto", "Contacto"],
            ]
              .filter((e): e is [string, string] => Array.isArray(e))
              .map(([href, texto]) => (
                <a
                  key={href}
                  href={href}
                  className="text-xs font-medium uppercase tracking-[0.22em] text-(--n-texto)/70 transition-colors hover:text-(--n-acento)"
                >
                  {texto}
                </a>
              ))}
          </nav>
          {cta && (
            <BotonCta cta={cta} className={`${botonLinea} shrink-0`}>
              {conReservas ? "Reservar" : "Escribinos"}
            </BotonCta>
          )}
        </div>
      </header>

      <main>
        <section className="relative">
          <div className="mx-auto grid max-w-6xl items-center gap-16 px-5 pb-24 pt-6 lg:grid-cols-[1.08fr_0.92fr] lg:pb-32 lg:pt-12">
            <div>
              <Reveal y={10}>
                <Etiqueta>
                  {tema.etiqueta ?? "Reservas online"}
                  {negocio.direccion ? ` · ${negocio.direccion}` : ""}
                </Etiqueta>
              </Reveal>
              <Reveal delay={0.1} y={18}>
                <h1 className="editorial-titulo mt-7 text-[3.6rem] font-light leading-[0.92] tracking-tight sm:text-8xl lg:text-[6.6rem]">
                  {negocio.nombre}
                </h1>
                <p className="editorial-titulo mt-4 text-4xl italic text-(--n-acento) sm:text-5xl">{tema.lema}</p>
              </Reveal>
              <Reveal delay={0.25} className="mt-8 max-w-md">
                <p className="text-xl leading-relaxed text-(--n-texto)/75">{tema.intro}</p>
              </Reveal>
              <Reveal delay={0.35} className="mt-10 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
                {cta && (
                  <BotonCta cta={cta} className={botonPrimario}>
                    {cta.texto} <Flecha />
                  </BotonCta>
                )}
                {servicios.length > 0 && (
                  <a
                    href="#servicios"
                    className="text-xs font-medium uppercase tracking-[0.22em] text-(--n-texto)/70 underline decoration-(--n-acento)/50 underline-offset-8 transition-colors hover:text-(--n-acento)"
                  >
                    Ver la carta
                  </a>
                )}
              </Reveal>
              {datos.length > 0 && (
                <Reveal delay={0.45}>
                  <ul className="mt-12 flex flex-wrap gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-(--n-texto)/65">
                    {datos.map((d) => (
                      <li key={d} className="rounded-full border border-(--n-texto)/15 bg-(--n-tarjeta)/60 px-4 py-1.5">
                        {d}
                      </li>
                    ))}
                  </ul>
                </Reveal>
              )}
            </div>

            {tema.portada && (
              <Reveal delay={0.2} y={30} className="relative mx-auto w-full max-w-[22rem] sm:max-w-sm">
                <div
                  aria-hidden
                  className="absolute -right-5 top-6 aspect-[3/4] w-full rounded-t-full border border-(--n-acento)/50"
                />
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-t-full bg-(--n-tarjeta) shadow-[0_40px_80px_-40px_rgba(0,0,0,0.45)]">
                  <Image
                    src={tema.portada}
                    alt={tema.portadaAlt ?? ""}
                    fill
                    priority
                    sizes="(min-width: 1024px) 24rem, 80vw"
                    className="object-cover"
                  />
                </div>
                {fotoChica && (
                  <div className="absolute -bottom-8 -left-6 size-32 overflow-hidden rounded-full border-[6px] border-(--n-fondo) shadow-lg sm:-left-14 sm:size-40">
                    <Image src={fotoChica.src} alt="" fill sizes="10rem" className="object-cover" />
                  </div>
                )}
                <div className="absolute -right-4 -top-8 sm:-right-12">
                  <Sello texto={`${conReservas ? "Reservá online" : "Te esperamos"} ✦ ${negocio.nombre} ✦ `} logo={tema.logo} />
                </div>
              </Reveal>
            )}
          </div>
        </section>

        {cinta.length > 0 && (
          <section aria-label="Tratamientos" className="bg-(--color-violeta)/60 py-5">
            <Marquee
              items={cinta.length < 4 ? [...cinta, ...cinta] : cinta}
              className="editorial-titulo text-3xl italic text-(--n-texto)/85 sm:text-4xl"
            />
          </section>
        )}

        {servicios.length > 0 && (
          <section id="servicios" aria-labelledby="servicios-titulo" className="mx-auto max-w-6xl px-5 py-28">
            <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
              <div className="lg:sticky lg:top-12 lg:self-start">
                <Reveal>
                  <Etiqueta>Carta de tratamientos</Etiqueta>
                  <Titulo id="servicios-titulo">{tema.tituloServicios ?? "Servicios"}</Titulo>
                  <p className="mt-6 max-w-sm text-xl text-(--n-texto)/70">
                    {tema.subtituloServicios ?? "Tocá el que quieras y elegí tu horario."}
                  </p>
                </Reveal>
                {fotoServicios && (
                  <Reveal delay={0.15} className="mt-12 hidden lg:block">
                    <div className="relative aspect-[4/5] w-full max-w-xs overflow-hidden rounded-t-full rounded-b-[2rem]">
                      <Image src={fotoServicios.src} alt={fotoServicios.alt} fill sizes="20rem" className="object-cover" />
                    </div>
                  </Reveal>
                )}
              </div>

              <ul className="grid gap-5">
                {servicios.map((s, i) => {
                  const contenido = (
                    <>
                      <div className="flex items-center justify-between gap-4">
                        <span className="editorial-titulo text-2xl italic text-(--n-acento) tabular-nums">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {conReservas && (
                          <span className="rounded-full bg-(--color-violeta)/60 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-(--n-texto)/75">
                            {formatoDuracion(s.duracion_minutos)}
                          </span>
                        )}
                      </div>
                      <h3 className="editorial-titulo mt-3 text-3xl font-medium leading-tight sm:text-4xl">{s.nombre}</h3>
                      {s.descripcion && <p className="mt-2 text-lg text-(--n-texto)/65">{s.descripcion}</p>}
                      <div className="mt-6 flex items-end justify-between gap-4 border-t border-(--n-texto)/10 pt-5">
                        <span className="editorial-titulo text-3xl font-medium tabular-nums">{formatoPrecio(s.precio)}</span>
                        {conReservas && (
                          <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-(--n-acento)">
                            Reservar <Flecha />
                          </span>
                        )}
                      </div>
                    </>
                  );
                  const clases =
                    "group block rounded-[2rem] border border-(--n-texto)/10 bg-(--n-tarjeta)/80 p-7 backdrop-blur-sm transition duration-300 sm:p-9";
                  return (
                    <li key={s.id}>
                      <Reveal delay={(i % 3) * 0.06}>
                        {conReservas ? (
                          <Link
                            href={reservarHref}
                            className={`${clases} hover:-translate-y-1 hover:border-(--n-acento)/40 hover:shadow-[0_24px_50px_-30px_var(--n-acento)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--n-acento)`}
                          >
                            {contenido}
                          </Link>
                        ) : (
                          <div className={clases}>{contenido}</div>
                        )}
                      </Reveal>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        )}

        <section aria-label="Nuestra filosofía" className="relative isolate overflow-hidden bg-(--n-tarjeta) py-28">
          <div aria-hidden className="absolute left-1/2 top-1/2 -z-10 size-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-(--n-acento)/15" />
          <div aria-hidden className="absolute left-1/2 top-1/2 -z-10 size-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-(--n-acento)/20" />
          <Reveal className="mx-auto max-w-3xl px-5 text-center">
            {tema.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tema.logo} alt="" className="mx-auto size-14" />
            )}
            <p className="editorial-titulo mt-8 text-4xl font-light italic leading-snug sm:text-5xl">
              Cuidarte no es un lujo: es un rato para vos, en un lugar pensado para que{" "}
              <span className="text-(--n-acento)">te desconectes</span>.
            </p>
            <p className="mt-8 text-xs font-medium uppercase tracking-[0.3em] text-(--n-texto)/55">{negocio.nombre}</p>
          </Reveal>
        </section>

        {galeria.length > 0 && (
          <section aria-labelledby="galeria" className="mx-auto max-w-6xl px-5 py-28">
            <Reveal className="text-center">
              <Etiqueta centrada>Inspiración</Etiqueta>
              <Titulo id="galeria">El espacio</Titulo>
            </Reveal>
            <ul className="mt-16 grid items-start gap-10 md:grid-cols-3 md:gap-8">
              {galeria.map((foto, i) => {
                const forma = [
                  "aspect-[3/4] rounded-t-full rounded-b-[1.5rem]",
                  "aspect-square rounded-full md:mt-20",
                  "aspect-[3/4] rounded-[1.5rem] rounded-br-[6rem]",
                ][i % 3];
                return (
                  <li key={foto.src}>
                    <Reveal delay={i * 0.1}>
                      <figure>
                        <div className={`group relative overflow-hidden bg-(--n-tarjeta) ${forma}`}>
                          <Image
                            src={foto.src}
                            alt={foto.alt}
                            fill
                            sizes="(min-width: 768px) 30vw, 90vw"
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        </div>
                        <figcaption className="editorial-titulo mt-4 text-center text-lg italic text-(--n-texto)/60">
                          {foto.alt}
                        </figcaption>
                      </figure>
                    </Reveal>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {profesionales.length > 0 && (
          <section id="equipo" aria-labelledby="equipo-titulo" className="bg-(--color-violeta)/40 py-28">
            <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 lg:grid-cols-2 lg:gap-20">
              {tema.fondoEquipo && (
                <Reveal y={30}>
                  <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-t-full rounded-b-[2rem] shadow-[0_40px_80px_-40px_rgba(0,0,0,0.45)]">
                    <Image
                      src={tema.fondoEquipo}
                      alt={tema.fondoEquipoAlt ?? ""}
                      fill
                      sizes="(min-width: 1024px) 28rem, 90vw"
                      className="object-cover"
                      style={{ objectPosition: tema.fondoEquipoPosicion }}
                    />
                  </div>
                </Reveal>
              )}
              <div className={tema.fondoEquipo ? "" : "lg:col-span-2"}>
                <Reveal>
                  <Etiqueta>Manos expertas</Etiqueta>
                  <Titulo id="equipo-titulo">{vocab.equipo}</Titulo>
                  <p className="mt-6 max-w-md text-xl text-(--n-texto)/70">
                    Elegí con quién atenderte o dejá que te toque quien tenga el primer lugar libre.
                  </p>
                </Reveal>
                <ul className="mt-10 grid gap-4">
                  {profesionales.map((p, i) => (
                    <li key={p.id}>
                      <Reveal delay={i * 0.08}>
                        <div className="flex items-center gap-5 rounded-full bg-(--n-fondo)/80 py-3 pl-3 pr-7 backdrop-blur-sm">
                          <span
                            aria-hidden
                            className="flex size-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-(--color-violeta) to-(--n-acento)/40 editorial-titulo text-2xl italic"
                          >
                            {p.nombre.charAt(0).toUpperCase()}
                          </span>
                          <span className="editorial-titulo text-3xl font-medium">{p.nombre}</span>
                        </div>
                      </Reveal>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        {conReservas && (
          <section aria-labelledby="como" className="mx-auto max-w-6xl px-5 py-28">
            <Reveal className="text-center">
              <Etiqueta centrada>Paso a paso</Etiqueta>
              <Titulo id="como">Reservar es así de fácil</Titulo>
            </Reveal>
            <ol className="relative mt-16 grid gap-12 text-center md:grid-cols-3">
              <span aria-hidden className="absolute inset-x-[17%] top-8 hidden h-px bg-(--n-acento)/30 md:block" />
              {pasos.map((paso, i) => (
                <li key={paso.titulo} className="relative">
                  <Reveal delay={i * 0.12}>
                    <span
                      aria-hidden
                      className="mx-auto flex size-16 items-center justify-center rounded-full border border-(--n-acento)/40 bg-(--n-fondo) editorial-titulo text-3xl italic text-(--n-acento)"
                    >
                      {i + 1}
                    </span>
                    <h3 className="editorial-titulo mt-6 text-3xl font-medium">{paso.titulo}</h3>
                    <p className="mx-auto mt-2 max-w-xs text-lg text-(--n-texto)/65">{paso.texto}</p>
                  </Reveal>
                </li>
              ))}
            </ol>
          </section>
        )}

        {hayContacto && (
          <section id="contacto" aria-labelledby="contacto-titulo" className="mx-auto max-w-6xl px-5 pb-28">
            <Reveal className="text-center">
              <Etiqueta centrada>Visitanos</Etiqueta>
              <Titulo id="contacto-titulo">Dónde estamos</Titulo>
            </Reveal>
            <ul className="mt-14 flex flex-wrap justify-center gap-5">
              {[
                negocio.direccion && { titulo: "Dirección", texto: negocio.direccion, href: mapa },
                negocio.telefono && { titulo: "WhatsApp", texto: negocio.telefono, href: whatsapp },
                negocio.email && { titulo: "Mail", texto: negocio.email, href: `mailto:${negocio.email}` },
              ]
                .filter((d): d is { titulo: string; texto: string; href: string | null } => Boolean(d))
                .map((d) => (
                  <li
                    key={d.titulo}
                    className="w-full rounded-[2rem] border border-(--n-texto)/10 bg-(--n-tarjeta) p-8 text-center sm:w-[calc(50%-0.7rem)] md:w-[calc(33.333%-0.85rem)]"
                  >
                    <p className="text-xs font-medium uppercase tracking-[0.28em] text-(--n-texto)/50">{d.titulo}</p>
                    <p className="editorial-titulo mt-3 break-words text-3xl font-medium leading-snug">
                      {d.href ? (
                        <a
                          href={d.href}
                          target={d.href.startsWith("mailto:") ? undefined : "_blank"}
                          rel="noopener noreferrer"
                          className="underline decoration-(--n-acento)/50 underline-offset-[6px] hover:decoration-(--n-acento)"
                        >
                          {d.texto}
                        </a>
                      ) : (
                        d.texto
                      )}
                    </p>
                  </li>
                ))}
            </ul>
          </section>
        )}

        <section className="px-5 pb-24">
          <Reveal>
            <div className="relative isolate mx-auto grid max-w-6xl items-center gap-10 overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-(--color-violeta) via-(--n-tarjeta) to-(--color-violeta)/70 p-8 sm:p-14 lg:grid-cols-[1.2fr_0.8fr]">
              <div aria-hidden className="absolute -right-24 -top-24 -z-10 size-80 rounded-full bg-(--n-acento)/15 blur-3xl" />
              <div className="text-center lg:text-left">
                <h2 className="editorial-titulo text-5xl font-light leading-[1.02] tracking-tight sm:text-7xl">
                  {conReservas ? (
                    <>
                      Regalate <span className="italic text-(--n-acento)">un momento.</span>
                    </>
                  ) : (
                    <>
                      ¿Te <span className="italic text-(--n-acento)">esperamos?</span>
                    </>
                  )}
                </h2>
                <p className="mx-auto mt-6 max-w-md text-xl text-(--n-texto)/70 lg:mx-0">
                  {conReservas
                    ? "Elegí tu tratamiento y tu horario en menos de un minuto."
                    : "Escribinos por cualquier consulta o pasá a visitarnos."}
                </p>
                {cta && (
                  <div className="mt-10 flex justify-center lg:justify-start">
                    <BotonCta cta={cta} className={botonPrimario}>
                      {cta.texto} <Flecha />
                    </BotonCta>
                  </div>
                )}
              </div>
              {galeria[2] && (
                <div className="relative mx-auto hidden aspect-square w-full max-w-xs overflow-hidden rounded-full border-8 border-(--n-fondo)/70 lg:block">
                  <Image src={galeria[2].src} alt="" fill sizes="20rem" className="object-cover" />
                </div>
              )}
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-5 pb-12 pt-4 text-sm text-(--n-texto)/55">
        <p>
          {conReservas ? "Reservas con" : "Web hecha con"}{" "}
          <Link href="/" className="underline hover:text-(--n-acento)">
            Tu Turno
          </Link>{" "}
          ·{" "}
          <Link href="/privacidad" className="underline hover:text-(--n-acento)">
            Privacidad
          </Link>
        </p>
      </footer>

      {cta && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-(--n-texto)/10 bg-(--n-fondo)/90 px-5 py-3 backdrop-blur sm:hidden">
          <BotonCta cta={cta} className={`${botonPrimario} w-full`} />
        </div>
      )}
    </div>
  );
}
