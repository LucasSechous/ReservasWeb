import Image from "next/image";
import Link from "next/link";
import { BannerDemo } from "@/components/banner-demo";
import { BotonCta, type Cta } from "@/components/boton-cta";
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

// Landing con estilo editorial: fondo claro, letras serif finas, mucho aire y líneas delgadas, como una
// revista de belleza. Se elige con `estilo: "editorial"` en el tema. El flujo de reservar (/[slug]/reservar)
// toma los colores del tema, así que funciona también con esta paleta clara.

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
  { titulo: "Elegís el tratamiento", texto: "Mirá la lista y quedate con el que necesitás." },
  { titulo: "Elegís día y horario", texto: "Solo ves los horarios que de verdad están libres." },
  { titulo: "Listo, tenés turno", texto: "Tu lugar queda reservado al instante." },
];

const enlaceFino =
  "text-xs font-medium uppercase tracking-[0.22em] text-(--n-texto)/70 transition-colors hover:text-(--n-acento)";
const botonPrimario =
  "group inline-flex min-h-13 items-center justify-center gap-3 border border-(--n-texto) bg-(--n-texto) px-8 text-sm font-medium uppercase tracking-[0.22em] text-(--n-fondo) transition-colors hover:border-(--n-acento) hover:bg-(--n-acento) hover:text-(--n-acento-tinta) focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--n-acento)";
const botonLinea =
  "inline-flex items-center justify-center border border-(--n-texto)/35 px-5 py-2.5 text-xs font-medium uppercase tracking-[0.22em] transition-colors hover:border-(--n-texto) hover:bg-(--n-texto) hover:text-(--n-fondo)";
const etiqueta = "text-xs font-medium uppercase tracking-[0.28em] text-(--n-acento)";

function Flecha() {
  return (
    <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">
      →
    </span>
  );
}

function Titulo({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="editorial-titulo text-5xl font-light leading-[1.02] tracking-tight sm:text-7xl"
    >
      {children}
    </h2>
  );
}

export function LandingEditorial({
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
  const datos = [
    servicios.length > 0
      ? tema.rubro && tema.rubro !== "belleza"
        ? cantidadDe(servicios.length, vocab, "servicio")
        : `${servicios.length} ${conReservas ? "tratamientos" : "servicios"}`
      : null,
    conReservas && profesionales.length > 0
      ? cantidadDe(profesionales.length, vocab, "profesional")
      : null,
    conReservas ? "Confirmación al instante" : null,
  ].filter((d): d is string => d !== null);

  return (
    <div
      style={temaStyle(tema)}
      className="editorial-texto min-h-screen overflow-x-clip bg-(--n-fondo) pb-28 text-lg text-(--n-texto) selection:bg-(--n-acento) selection:text-(--n-acento-tinta) sm:pb-0"
    >
      <title>{conReservas ? `${negocio.nombre} · Reservá tu turno` : negocio.nombre}</title>
      {tema.demo && <BannerDemo />}

      <header className="border-b border-(--n-texto)/12">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-5 py-5">
          <span className="flex items-center gap-3 editorial-titulo text-2xl font-medium tracking-tight">
            {tema.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tema.logo} alt="" className="size-9" />
            )}
            {negocio.nombre}
          </span>
          <nav aria-label="Secciones" className="hidden items-center gap-9 md:flex">
            {servicios.length > 0 && (
              <a href="#servicios" className={enlaceFino}>
                {tema.tituloServicios ?? "Servicios"}
              </a>
            )}
            {profesionales.length > 0 && (
              <a href="#equipo" className={enlaceFino}>
                Equipo
              </a>
            )}
            {hayContacto && (
              <a href="#contacto" className={enlaceFino}>
                Contacto
              </a>
            )}
          </nav>
          {cta && (
            <BotonCta cta={cta} className={botonLinea}>
              {conReservas ? "Reservar" : "Escribinos"}
            </BotonCta>
          )}
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-14 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:pb-28 lg:pt-20">
          <div>
            <Reveal y={10}>
              <p className={etiqueta}>
                {tema.etiqueta ?? "Reservas online"}
                {negocio.direccion ? ` — ${negocio.direccion}` : ""}
              </p>
            </Reveal>
            <Reveal delay={0.1} y={18}>
              <h1 className="editorial-titulo mt-7 text-[3.4rem] font-light leading-[0.95] tracking-tight sm:text-7xl lg:text-[6.4rem]">
                {negocio.nombre}
                <span className="mt-3 block text-[0.62em] font-normal italic leading-[1.05] text-(--n-acento)">
                  {tema.lema}
                </span>
              </h1>
            </Reveal>
            <Reveal delay={0.25} className="mt-9 max-w-md">
              <p className="text-xl leading-relaxed text-(--n-texto)/75">{tema.intro}</p>
            </Reveal>
            {cta && (
              <Reveal delay={0.35} className="mt-10">
                <BotonCta cta={cta} className={botonPrimario}>
                  {cta.texto} <Flecha />
                </BotonCta>
              </Reveal>
            )}
          </div>

          {tema.portada && (
            <Reveal delay={0.2} y={30} className="relative mx-auto w-full max-w-sm">
              <div
                aria-hidden
                className="absolute -right-4 top-5 aspect-[3/4] w-full rounded-t-[999px] border border-(--n-acento)/60"
              />
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-t-[999px] bg-(--n-tarjeta)">
                <Image
                  src={tema.portada}
                  alt=""
                  fill
                  priority
                  sizes="(min-width: 1024px) 24rem, 80vw"
                  className="object-cover"
                />
              </div>
            </Reveal>
          )}
        </section>

        {datos.length > 0 && (
          <div className="border-y border-(--n-texto)/12">
            <ul className="mx-auto flex max-w-6xl flex-wrap justify-center gap-x-12 gap-y-2 px-5 py-5 text-xs font-medium uppercase tracking-[0.24em] text-(--n-texto)/65">
              {datos.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
        )}

        {servicios.length > 0 && (
          <section
            aria-labelledby="servicios-titulo"
            id="servicios"
            className="mx-auto max-w-6xl px-5 py-28"
          >
            <Reveal>
              <p className={etiqueta}>Carta de servicios</p>
              <div className="mt-4">
                <Titulo id="servicios-titulo">{tema.tituloServicios ?? "Servicios"}</Titulo>
              </div>
              <p className="mt-6 max-w-lg text-xl text-(--n-texto)/70">
                {tema.subtituloServicios ?? "Tocá el que quieras y elegí tu horario."}
              </p>
            </Reveal>
            <ul className="mt-14 divide-y divide-(--n-texto)/15 border-y border-(--n-texto)/15">
              {servicios.map((s, i) => {
                const fila = (
                  <>
                    <span className="editorial-titulo pt-1 text-xl italic text-(--n-acento) tabular-nums sm:text-2xl">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0">
                      <span className="editorial-titulo block text-3xl font-medium leading-tight sm:text-4xl">
                        {s.nombre}
                      </span>
                      {s.descripcion && (
                        <span className="mt-1.5 block text-lg text-(--n-texto)/65">
                          {s.descripcion}
                        </span>
                      )}
                      {conReservas && (
                        <span className="mt-2 block text-xs font-medium uppercase tracking-[0.22em] text-(--n-texto)/50">
                          {formatoDuracion(s.duracion_minutos)}
                        </span>
                      )}
                    </span>
                    <span className="flex items-center gap-4 pt-1">
                      <span className="editorial-titulo text-2xl font-medium tabular-nums sm:text-3xl">
                        {formatoPrecio(s.precio)}
                      </span>
                      {conReservas && (
                        <span
                          aria-hidden
                          className="hidden text-xl text-(--n-acento) transition-transform duration-300 group-hover:translate-x-1 sm:inline"
                        >
                          →
                        </span>
                      )}
                    </span>
                  </>
                );
                const clases =
                  "group grid grid-cols-[2.6rem_1fr_auto] items-start gap-x-4 px-1 py-8 transition-colors sm:grid-cols-[4rem_1fr_auto] sm:gap-x-8 sm:px-4";
                return (
                  <li key={s.id}>
                    {conReservas ? (
                      <Link href={reservarHref} className={`${clases} hover:bg-(--n-tarjeta)`}>
                        {fila}
                      </Link>
                    ) : (
                      <div className={clases}>{fila}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {tema.galeria && tema.galeria.length > 0 && (
          <section aria-labelledby="galeria" className="mx-auto max-w-6xl px-5 pb-28">
            <Reveal>
              <p className={etiqueta}>Inspiración</p>
              <div className="mt-4">
                <Titulo id="galeria">Galería</Titulo>
              </div>
            </Reveal>
            <ul className="mt-14 grid items-start gap-8 md:grid-cols-3">
              {tema.galeria.map((foto, i) => {
                const forma = [
                  "aspect-[3/4] rounded-t-[999px]",
                  "aspect-square rounded-full md:mt-24",
                  "aspect-[4/5] rounded-[0.4rem]",
                ][i % 3];
                return (
                  <li key={foto.src}>
                    <Reveal delay={i * 0.1}>
                      <div className={`relative overflow-hidden bg-(--n-tarjeta) ${forma}`}>
                        <Image
                          src={foto.src}
                          alt={foto.alt}
                          fill
                          sizes="(min-width: 768px) 30vw, 90vw"
                          className="object-cover"
                        />
                      </div>
                    </Reveal>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {profesionales.length > 0 && (
          <section
            aria-labelledby="equipo-titulo"
            id="equipo"
            className="border-y border-(--n-texto)/12"
          >
            <div className="mx-auto grid max-w-6xl lg:grid-cols-2">
              {tema.fondoEquipo && (
                <div className="relative aspect-[4/3] w-full lg:aspect-auto lg:min-h-[34rem]">
                  <Image
                    src={tema.fondoEquipo}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover"
                    style={{ objectPosition: tema.fondoEquipoPosicion }}
                  />
                </div>
              )}
              <div
                className={`flex flex-col justify-center px-5 py-20 lg:px-14 ${tema.fondoEquipo ? "" : "lg:col-span-2"}`}
              >
                <Reveal>
                  <p className={etiqueta}>Manos expertas</p>
                  <div className="mt-4">
                    <Titulo id="equipo-titulo">{vocab.equipo}</Titulo>
                  </div>
                </Reveal>
                <ul className="mt-10 divide-y divide-(--n-texto)/15 border-y border-(--n-texto)/15">
                  {profesionales.map((p) => (
                    <li key={p.id} className="flex items-baseline justify-between gap-6 py-5">
                      <span className="editorial-titulo text-3xl font-medium">{p.nombre}</span>
                      <span className="text-xs font-medium uppercase tracking-[0.22em] text-(--n-texto)/50">
                        Profesional
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        {conReservas && (
          <section aria-labelledby="como" className="mx-auto max-w-6xl px-5 py-28">
            <Reveal>
              <p className={etiqueta}>Paso a paso</p>
              <div className="mt-4">
                <Titulo id="como">Reservar es así de fácil</Titulo>
              </div>
            </Reveal>
            <ol className="mt-16 grid gap-12 md:grid-cols-3">
              {pasos.map((paso, i) => (
                <li key={paso.titulo}>
                  <Reveal delay={i * 0.12}>
                    <span
                      aria-hidden
                      className="editorial-titulo text-8xl font-light italic leading-none text-(--n-acento)/70"
                    >
                      {i + 1}
                    </span>
                    <h3 className="editorial-titulo mt-5 text-3xl font-medium">{paso.titulo}</h3>
                    <p className="mt-2 text-lg text-(--n-texto)/65">{paso.texto}</p>
                  </Reveal>
                </li>
              ))}
            </ol>
          </section>
        )}

        {hayContacto && (
          <section
            aria-labelledby="contacto-titulo"
            id="contacto"
            className="border-t border-(--n-texto)/12 bg-(--n-tarjeta)"
          >
            <div className="mx-auto max-w-6xl px-5 py-24">
              <Reveal>
                <p className={etiqueta}>Visitanos</p>
                <div className="mt-4">
                  <Titulo id="contacto-titulo">Dónde estamos</Titulo>
                </div>
              </Reveal>
              <ul className="mt-14 grid gap-10 md:grid-cols-3">
                {negocio.direccion && (
                  <li className="border-t border-(--n-texto)/25 pt-5">
                    <p className="text-xs font-medium uppercase tracking-[0.24em] text-(--n-texto)/50">
                      Dirección
                    </p>
                    <p className="editorial-titulo mt-3 text-3xl font-medium leading-snug">
                      {mapa ? (
                        <a
                          href={mapa}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline decoration-(--n-acento)/60 underline-offset-4 hover:decoration-(--n-acento)"
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
                  <li className="border-t border-(--n-texto)/25 pt-5">
                    <p className="text-xs font-medium uppercase tracking-[0.24em] text-(--n-texto)/50">
                      WhatsApp
                    </p>
                    <p className="editorial-titulo mt-3 text-3xl font-medium leading-snug">
                      {whatsapp ? (
                        <a
                          href={whatsapp}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline decoration-(--n-acento)/60 underline-offset-4 hover:decoration-(--n-acento)"
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
                  <li className="border-t border-(--n-texto)/25 pt-5">
                    <p className="text-xs font-medium uppercase tracking-[0.24em] text-(--n-texto)/50">
                      Mail
                    </p>
                    <p className="editorial-titulo mt-3 break-all text-3xl font-medium leading-snug">
                      <a
                        href={`mailto:${negocio.email}`}
                        className="underline decoration-(--n-acento)/60 underline-offset-4 hover:decoration-(--n-acento)"
                      >
                        {negocio.email}
                      </a>
                    </p>
                  </li>
                )}
              </ul>
            </div>
          </section>
        )}

        <section className="bg-(--color-violeta)/45 py-28">
          <div className="mx-auto max-w-4xl px-5 text-center">
            <Reveal>
              <h2 className="editorial-titulo text-5xl font-light leading-[1.02] tracking-tight sm:text-7xl">
                {conReservas ? (
                  <>
                    ¿Te reservamos <span className="italic text-(--n-acento)">un turno?</span>
                  </>
                ) : (
                  <>
                    ¿Te <span className="italic text-(--n-acento)">esperamos?</span>
                  </>
                )}
              </h2>
              <p className="mx-auto mt-6 max-w-md text-xl text-(--n-texto)/70">
                {conReservas
                  ? "Elegí tu horario en menos de un minuto."
                  : "Escribinos por cualquier consulta o pasá a visitarnos."}
              </p>
              {cta && (
                <div className="mt-10 flex justify-center">
                  <BotonCta cta={cta} className={botonPrimario}>
                    {cta.texto} <Flecha />
                  </BotonCta>
                </div>
              )}
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-5 pb-12 pt-8 text-sm text-(--n-texto)/55">
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
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-(--n-texto)/15 bg-(--n-fondo)/95 px-5 py-3 backdrop-blur sm:hidden">
          <BotonCta cta={cta} className={`${botonPrimario} w-full`} />
        </div>
      )}
    </div>
  );
}
