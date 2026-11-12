import Image from "next/image";
import Link from "next/link";
import { BannerDemo } from "@/components/banner-demo";
import { BotonCta, type Cta } from "@/components/boton-cta";
import { Galeria } from "@/components/galeria";
import { Marquee } from "@/components/marquee";
import { Giro, Palabras, Parallax, Trazo } from "@/components/movimiento";
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

// Landing con estilo de barbería clásica: papel crema, tinta azul marino, rojo de poste de barbero,
// serif de cartel y rótulos angostos en mayúscula. Se elige con `estilo: "clasica"` en el tema.
// Los colores salen del tema: texto = azul marino, acento = rojo, brillo = azul de las franjas.

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

const ROMANOS = ["I", "II", "III"];

const pasos = [
  { titulo: "Elegís el servicio", texto: "Corte, barba o los dos. Mirá la lista y quedate con el tuyo." },
  { titulo: "Elegís barbero y horario", texto: "Solo ves los horarios que de verdad están libres." },
  { titulo: "Te sentás en el sillón", texto: "Tu lugar queda reservado al instante. Llegás y listo." },
];

// Botón rojo con un canto más oscuro abajo, como un cartel esmaltado.
const boton =
  "inline-flex min-h-13 items-center justify-center gap-2 rounded-md bg-(--n-acento) px-8 clasica-rotulo text-sm font-semibold text-(--n-acento-tinta) shadow-[0_4px_0_color-mix(in_srgb,var(--n-acento),black_38%)] transition hover:-translate-y-0.5 hover:shadow-[0_6px_0_color-mix(in_srgb,var(--n-acento),black_38%)] active:translate-y-1 active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--n-texto)";

/** Franja de poste de barbero, horizontal. */
function Franja({ className = "h-2.5" }: { className?: string }) {
  return <div aria-hidden className={`clasica-franjas w-full ${className}`} />;
}

/** Filete con estrella: ── ★ ── */
function Filete({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`flex items-center gap-3 text-(--n-acento) ${className}`}>
      <Trazo origen="right" className="h-px w-12 bg-current" />
      <span className="text-sm">★</span>
      <Trazo origen="left" className="h-px w-12 bg-current" />
    </div>
  );
}

/** Poste de barbero que gira (las franjas suben), con remate y base. */
function Poste({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`flex flex-col items-center ${className}`}>
      <span className="size-7 rounded-full border-2 border-(--n-texto) bg-[radial-gradient(circle_at_35%_30%,#fff,#d8d1c2)]" />
      <span className="h-3.5 w-14 rounded-t-lg bg-(--n-texto)" />
      <span className="clasica-franjas clasica-poste w-10 flex-1 border-x-2 border-(--n-texto)" />
      <span className="h-3.5 w-14 rounded-b-lg bg-(--n-texto)" />
    </div>
  );
}

function Titulo({ id, sobre, children, claro = false }: { id: string; sobre: string; children: React.ReactNode; claro?: boolean }) {
  return (
    <div className="text-center">
      <p className={`clasica-rotulo text-xs font-semibold ${claro ? "text-(--n-fondo)/70" : "text-(--n-acento)"}`}>
        {sobre}
      </p>
      <h2 id={id} className="mt-3 clasica-titulo text-4xl font-black leading-tight sm:text-6xl">
        {children}
      </h2>
      <Filete className="mt-5 justify-center" />
    </div>
  );
}

export function LandingClasica({
  negocio,
  servicios,
  profesionales,
  tema,
  cta,
  whatsapp,
  mapa,
  reservarHref,
}: Props) {
  const vocab = vocabularioDe(tema.rubro);
  const conReservas = tema.reservas !== false;
  const cinta = servicios.map((s) => s.nombre.toUpperCase());
  const hayContacto = negocio.direccion || negocio.telefono || negocio.email;
  const unProfesional = vocab.profesional.charAt(0).toUpperCase() + vocab.profesional.slice(1);

  return (
    <div
      style={temaStyle(tema)}
      className="min-h-screen overflow-x-clip bg-(--n-fondo) pb-28 text-(--n-texto) selection:bg-(--n-acento) selection:text-(--n-acento-tinta) sm:pb-0"
    >
      {tema.demo && <BannerDemo />}
      <Franja />

      <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-5">
        <span className="flex min-w-0 items-center gap-3 clasica-titulo text-xl font-black sm:text-2xl">
          {tema.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tema.logo} alt={`Logo de ${negocio.nombre}`} className="size-11 shrink-0" />
          )}
          <span className="truncate">{negocio.nombre}</span>
        </span>
        {cta && (
          <BotonCta
            cta={cta}
            className="shrink-0 rounded-md border-2 border-(--n-texto) px-4 py-2 clasica-rotulo text-xs font-semibold transition hover:bg-(--n-texto) hover:text-(--n-fondo)"
          >
            {conReservas ? "Reservar" : "Escribinos"}
          </BotonCta>
        )}
      </header>

      <main>
        <section className="relative isolate overflow-hidden">
          {/* Viñeta suave y un filete de puntos, como papel de cartel antiguo. */}
          <div
            aria-hidden
            className="absolute inset-0 -z-10 [background-image:radial-gradient(color-mix(in_srgb,var(--n-texto)_9%,transparent)_1px,transparent_1.5px)] [background-size:18px_18px] [mask-image:radial-gradient(ellipse_at_30%_40%,black,transparent_75%)]"
          />
          <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-8 lg:grid-cols-[1.15fr_0.85fr] lg:pb-24 lg:pt-14">
            <div>
              <Reveal y={12}>
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 clasica-rotulo text-xs font-semibold text-(--n-acento)">
                  <span aria-hidden className="h-px w-10 bg-current" />
                  {tema.etiqueta ?? "Reservas online"}
                </p>
              </Reveal>
              <h1 className="mt-6 clasica-titulo text-[3.3rem] font-black leading-[0.95] tracking-tight sm:text-7xl lg:text-[5.4rem]">
                <Palabras texto={negocio.nombre} delay={0.1} />
              </h1>
              <p className="mt-4 inline-block clasica-titulo text-3xl font-bold italic text-(--n-acento) sm:text-4xl">
                <Palabras texto={tema.lema} delay={0.35} paso={0.06} />
                <Trazo alCargar delay={0.9} className="mt-1 h-[3px] w-full bg-current" />
              </p>
              <Reveal delay={0.2}>
                <Filete className="mt-7" />
              </Reveal>
              <Reveal delay={0.25} className="mt-6 max-w-xl">
                <p className="text-lg leading-relaxed text-(--n-texto)/75">{tema.intro}</p>
              </Reveal>
              <Reveal delay={0.35} className="mt-9">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  {cta && (
                    <BotonCta cta={cta} className={boton}>
                      {cta.texto} <span aria-hidden>→</span>
                    </BotonCta>
                  )}
                  {conReservas && (
                    <ul className="flex flex-wrap gap-x-5 gap-y-2 clasica-rotulo text-[11px] font-semibold text-(--n-texto)/70">
                      {servicios.length > 0 && <li>{cantidadDe(servicios.length, vocab, "servicio")}</li>}
                      {profesionales.length > 0 && (
                        <li>{cantidadDe(profesionales.length, vocab, "profesional")}</li>
                      )}
                      <li>Confirmación al instante</li>
                    </ul>
                  )}
                </div>
              </Reveal>
            </div>

            {tema.portada && (
              <Reveal delay={0.2} y={30} className="relative mx-auto flex h-[30rem] w-full max-w-md gap-5 sm:h-[34rem]">
                <Poste className="hidden h-[85%] self-center sm:flex" />
                <div className="relative flex-1 rounded-t-full border-[3px] border-(--n-texto) bg-(--n-tarjeta) p-2.5 shadow-[10px_10px_0_var(--n-acento)]">
                  <div className="relative h-full overflow-hidden rounded-t-full">
                    <Parallax distancia={70} className="absolute inset-x-0 -top-[6%] h-[112%]">
                      <Image
                        src={tema.portada}
                        alt={tema.portadaAlt ?? ""}
                        fill
                        priority
                        sizes="(min-width: 1024px) 24rem, 80vw"
                        className="object-cover [filter:saturate(0.85)_contrast(1.05)]"
                      />
                    </Parallax>
                  </div>
                  {tema.logo && (
                    <Giro delay={0.7} className="absolute -bottom-8 -left-8 sm:-left-12">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={tema.logo} alt="" className="size-28 drop-shadow-[0_8px_16px_rgba(0,0,0,0.3)]" />
                    </Giro>
                  )}
                </div>
              </Reveal>
            )}
          </div>
        </section>

        {cinta.length > 0 && (
          <section aria-label="Servicios">
            <Franja className="h-2" />
            <div className="bg-(--n-texto) py-4 text-(--n-fondo)">
              <Marquee
                items={cinta.length < 4 ? [...cinta, ...cinta] : cinta}
                className="clasica-rotulo text-lg font-semibold sm:text-2xl"
              />
            </div>
            <Franja className="h-2" />
          </section>
        )}

        {servicios.length > 0 && (
          <section aria-labelledby="servicios" className="px-5 py-24">
            <Reveal>
              <Titulo id="servicios" sobre="Servicios">
                {tema.tituloServicios ?? "Lista de precios"}
              </Titulo>
              <p className="mx-auto mt-5 max-w-xl text-center text-lg text-(--n-texto)/70">
                {tema.subtituloServicios ?? "Tocá el servicio y elegí tu horario."}
              </p>
            </Reveal>
            {/* Pizarra de precios: azul marino con doble filete, como la de la pared de la barbería. */}
            <Reveal delay={0.1}>
              <div className="mx-auto mt-12 max-w-3xl rounded-xl bg-(--n-texto) p-2 text-(--n-fondo) shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)]">
                <ul className="divide-y divide-(--n-fondo)/12 rounded-lg border-2 border-double border-(--n-fondo)/35 px-5 py-3 sm:px-9 sm:py-5">
                  {servicios.map((s) => {
                    const fila = (
                      <>
                        <div className="flex items-baseline gap-3">
                          <h3 className="min-w-0 clasica-titulo text-xl font-bold sm:text-2xl">{s.nombre}</h3>
                          <span aria-hidden className="mb-1.5 flex-1 border-b-2 border-dotted border-(--n-fondo)/35 transition-colors duration-300 group-hover:border-solid group-hover:border-(--n-fondo)/70" />
                          <span className="shrink-0 whitespace-nowrap clasica-rotulo text-lg font-semibold tracking-wider">
                            {formatoPrecio(s.precio)}
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-start justify-between gap-4 text-sm">
                          <p className="text-(--n-fondo)/65">
                            {s.descripcion ?? formatoDuracion(s.duracion_minutos)}
                          </p>
                          {conReservas && (
                            <span className="shrink-0 clasica-rotulo text-[11px] font-semibold text-(--n-fondo)/55 transition group-hover:text-(--n-fondo)">
                              Reservar <span aria-hidden>→</span>
                            </span>
                          )}
                        </div>
                      </>
                    );
                    return (
                      <li key={s.id}>
                        {conReservas ? (
                          <Link
                            href={reservarHref}
                            className="group -mx-3 block rounded-md px-3 py-5 transition hover:bg-(--n-fondo)/[0.06] focus-visible:outline-2 focus-visible:outline-(--n-fondo)"
                          >
                            {fila}
                          </Link>
                        ) : (
                          <div className="py-5">{fila}</div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </Reveal>
          </section>
        )}

        {tema.galeria && tema.galeria.length > 0 && (
          <section aria-labelledby="galeria" className="mx-auto max-w-6xl px-5 pb-24">
            <Reveal>
              <Titulo id="galeria" sobre="El local">
                Un vistazo
              </Titulo>
            </Reveal>
            <div className="mt-12">
              <Galeria fotos={tema.galeria} />
            </div>
          </section>
        )}

        {tema.frase && (
          <section aria-label="La frase de la casa" className="px-5 pb-24">
            <Reveal className="mx-auto max-w-3xl text-center">
              <Filete className="justify-center" />
              <p className="mt-8 clasica-titulo text-3xl font-bold italic leading-snug sm:text-5xl">
                “{tema.frase}”
              </p>
              <p className="mt-8 clasica-rotulo text-xs font-semibold text-(--n-acento)">{negocio.nombre}</p>
            </Reveal>
          </section>
        )}

        {profesionales.length > 0 && (
          <section aria-labelledby="equipo" className="relative isolate overflow-hidden bg-(--n-texto) py-24 text-(--n-fondo)">
            {tema.fondoEquipo && (
              <div aria-hidden className="absolute inset-0 -z-10">
                <Image
                  src={tema.fondoEquipo}
                  alt=""
                  fill
                  sizes="100vw"
                  className="object-cover opacity-25 grayscale"
                  style={{ objectPosition: tema.fondoEquipoPosicion }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-(--n-texto) via-(--n-texto)/70 to-(--n-texto)" />
              </div>
            )}
            <div className="mx-auto max-w-6xl px-5">
              <Reveal>
                <Titulo id="equipo" sobre="Quién te atiende" claro>
                  {vocab.equipo}
                </Titulo>
              </Reveal>
              <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {profesionales.map((p, i) => (
                  <li key={p.id}>
                    <Reveal delay={i * 0.08}>
                      <div className="flex items-center gap-5 rounded-xl border border-(--n-fondo)/20 bg-(--n-fondo)/[0.06] p-5 backdrop-blur-sm">
                        <span
                          aria-hidden
                          className="flex size-16 shrink-0 items-center justify-center rounded-full border-[3px] border-(--n-acento) bg-(--n-fondo) clasica-titulo text-2xl font-black text-(--n-texto) ring-2 ring-(--n-fondo)/30 ring-offset-2 ring-offset-(--n-texto)"
                        >
                          {p.nombre.charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <p className="clasica-titulo text-xl font-bold">{p.nombre}</p>
                          <p className="clasica-rotulo text-[11px] font-semibold text-(--n-fondo)/60">
                            {unProfesional}
                          </p>
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
              <Titulo id="como" sobre="Sin llamadas">
                Reservar es así de fácil
              </Titulo>
            </Reveal>
            <ol className="mt-14 grid gap-10 text-center md:grid-cols-3">
              {pasos.map((paso, i) => (
                <li key={paso.titulo}>
                  <Reveal delay={i * 0.12}>
                    <Giro delay={0.15 + i * 0.12}>
                      <span
                        aria-hidden
                        className="mx-auto flex size-20 items-center justify-center rounded-full border-2 border-(--n-texto) clasica-titulo text-3xl font-black text-(--n-acento) shadow-[inset_0_0_0_5px_var(--n-fondo),inset_0_0_0_6px_var(--n-texto)]"
                      >
                        {ROMANOS[i]}
                      </span>
                    </Giro>
                    <h3 className="mt-5 clasica-titulo text-2xl font-bold">{paso.titulo}</h3>
                    <p className="mx-auto mt-2 max-w-xs text-(--n-texto)/70">{paso.texto}</p>
                  </Reveal>
                </li>
              ))}
            </ol>
          </section>
        )}

        {hayContacto && (
          <section aria-labelledby="contacto" className="mx-auto max-w-6xl px-5 pb-24">
            <Reveal>
              <Titulo id="contacto" sobre="Te esperamos">
                Dónde estamos
              </Titulo>
            </Reveal>
            <Reveal delay={0.1}>
              <ul className="mt-12 grid gap-5 md:grid-cols-3">
                {negocio.direccion && (
                  <li className="rounded-xl border-2 border-(--n-texto) border-t-[6px] border-t-(--n-acento) bg-(--n-tarjeta) p-6">
                    <p className="clasica-rotulo text-[11px] font-semibold text-(--n-texto)/60">Dirección</p>
                    <p className="mt-3 clasica-titulo text-xl font-bold leading-snug">
                      {mapa ? (
                        <a
                          href={mapa}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline decoration-(--n-acento) decoration-2 underline-offset-4"
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
                  <li className="rounded-xl border-2 border-(--n-texto) border-t-[6px] border-t-(--color-violeta) bg-(--n-tarjeta) p-6">
                    <p className="clasica-rotulo text-[11px] font-semibold text-(--n-texto)/60">WhatsApp</p>
                    <p className="mt-3 clasica-titulo text-xl font-bold leading-snug">
                      {whatsapp ? (
                        <a
                          href={whatsapp}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline decoration-(--n-acento) decoration-2 underline-offset-4"
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
                  <li className="rounded-xl border-2 border-(--n-texto) border-t-[6px] border-t-(--n-texto) bg-(--n-tarjeta) p-6">
                    <p className="clasica-rotulo text-[11px] font-semibold text-(--n-texto)/60">Mail</p>
                    <p className="mt-3 break-all clasica-titulo text-xl font-bold leading-snug">
                      <a
                        href={`mailto:${negocio.email}`}
                        className="underline decoration-(--n-acento) decoration-2 underline-offset-4"
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
            <div className="mx-auto max-w-4xl overflow-hidden rounded-xl bg-(--n-texto) text-(--n-fondo) shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)]">
              <Franja />
              <div className="flex items-center gap-8 px-8 py-14 sm:px-14">
                <Poste className="hidden h-56 sm:flex" />
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="clasica-titulo text-4xl font-black leading-tight sm:text-6xl">
                    {conReservas ? (
                      <>
                        ¿Te guardamos <span className="italic text-[color-mix(in_srgb,var(--n-acento),white_25%)]">el sillón?</span>
                      </>
                    ) : (
                      "¿Te esperamos?"
                    )}
                  </h2>
                  <p className="mt-4 text-lg text-(--n-fondo)/70">
                    {conReservas
                      ? "Elegí tu horario en menos de un minuto."
                      : "Escribinos por cualquier consulta o pasá a visitarnos."}
                  </p>
                  {cta && (
                    <div className="mt-8">
                      <BotonCta cta={cta} className={boton}>
                        {cta.texto} <span aria-hidden>→</span>
                      </BotonCta>
                    </div>
                  )}
                </div>
              </div>
              <Franja />
            </div>
          </Reveal>
        </section>
      </main>

      <Franja className="h-2" />
      <footer className="mx-auto w-full max-w-6xl px-5 pb-12 pt-8 text-sm text-(--n-texto)/60">
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
        <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-(--n-texto) bg-(--n-fondo)/95 px-5 py-3 backdrop-blur sm:hidden">
          <BotonCta cta={cta} className={`${boton} w-full`} />
        </div>
      )}
    </div>
  );
}
