import Link from "next/link";
import { AntesDespues } from "@/components/antes-despues";
import { FondoMovil } from "@/components/fondo-movil";
import { HeroTitle } from "@/components/hero-title";
import { Logo } from "@/components/logo";
import { Marquee } from "@/components/marquee";
import { PhoneDemo } from "@/components/phone-demo";
import { Reveal } from "@/components/reveal";
import {
  EMAIL,
  TELEFONO_MOSTRADO,
  mailUrl,
  whatsappUrl,
} from "@/lib/contacto";

const boton =
  "group inline-flex min-h-13 items-center justify-center gap-2 rounded-full px-7 text-base font-bold transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent";
const botonPrimario = `${boton} bg-accent text-accent-ink hover:-translate-y-0.5 hover:shadow-[0_10px_40px_-8px_color-mix(in_srgb,var(--color-accent)_60%,transparent)]`;
const botonSecundario = `${boton} border border-white/25 text-white hover:border-white/60 hover:bg-white/5`;

function Flecha() {
  return (
    <span
      aria-hidden
      className="transition-transform duration-300 group-hover:translate-x-1"
    >
      →
    </span>
  );
}

function BotonesContacto() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={botonPrimario}
      >
        Escribinos por WhatsApp <Flecha />
      </a>
      <a href={mailUrl} className={botonSecundario}>
        Mandanos un mail
      </a>
    </div>
  );
}

const pasos = [
  {
    titulo: "Nos contás de tu negocio",
    texto:
      "Por WhatsApp o por mail. Con tu nombre, tus servicios y tu Instagram nos alcanza para empezar.",
  },
  {
    titulo: "Te mostramos cómo quedaría",
    texto:
      "Armamos una demo con tus colores, tu estilo y tus servicios, para que la veas en tu celular antes de decidir.",
  },
  {
    titulo: "La ajustamos y sale al aire",
    texto:
      "Cambiamos lo que haga falta y la dejamos online, lista para compartir en tu Instagram y tu WhatsApp.",
  },
];

const planes = [
  {
    nombre: "Landing",
    detalle: "Tu web propia, simple y lista",
    items: [
      "Tu identidad: colores, estilo y fotos",
      "Servicios, ubicación y horarios",
      "Botón directo a tu WhatsApp",
      "Pensada para el celular",
    ],
    pago: "Pago único",
  },
  {
    nombre: "Landing con reservas",
    detalle: "Todo lo anterior, y los turnos se reservan solos",
    items: [
      "Reserva online las 24 horas, desde el celular",
      "Sin turnos superpuestos",
      "Mail de confirmación al cliente y aviso a tu negocio",
      "Link para cancelar, y tu agenda siempre a mano",
    ],
    pago: "Armado + mensualidad",
    destacado: true,
  },
];

const dominios = [
  {
    titulo: "Lo comprás vos",
    texto:
      "Abrís tu cuenta en el registrador y pagás con tu tarjeta. Te guiamos en cada paso y después lo conectamos a tu web. Es lo más simple y queda siempre a tu nombre.",
  },
  {
    titulo: "Lo gestionamos nosotros",
    texto:
      "Lo registramos por vos y te cobramos el costo aparte, con su comprobante. Es tuyo: si algún día querés llevártelo a otro lado, te lo transferimos.",
  },
];

const demos = [
  {
    rubro: "Barbería",
    estilo: "Estilo clásico de barbería",
    tipo: "Landing con reservas",
    detalle: "Servicios, equipo y turnos online las 24 horas.",
    // Barbería: crema, azul marino y rojo, con franjas de poste de barbero arriba.
    card: "rounded-2xl border-2 border-[#13233f] bg-[#f4efe4] group-hover:-translate-y-1.5 group-hover:shadow-[0_20px_50px_-20px_rgba(195,32,47,0.55)]",
    panel: "rounded-lg border-4 border-double border-[#13233f] bg-[#e9e1cf]",
    etiqueta: "rounded-md bg-[#c3202f] text-[#fff]",
    titulo: "clasica-titulo text-3xl font-black text-[#13233f]",
    estiloTxt: "clasica-titulo text-base font-bold italic text-[#c3202f]",
    detalleTxt: "text-sm text-[#13233f]/70",
    cta: "clasica-rotulo rounded-md bg-[#13233f] text-xs font-semibold text-[#f4efe4] group-hover:bg-[#c3202f]",
    adorno: (
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-3 bg-[repeating-linear-gradient(45deg,#c3202f_0_10px,#fbf8f1_10px_20px,#1d4e9e_20px_30px,#fbf8f1_30px_40px)]"
      />
    ),
    href: "/barberia-demo",
    logo: "/negocios/barberia-demo/logo.svg",
    conReservas: true,
  },
  {
    rubro: "Centro de estética",
    estilo: "Estilo spa, suave y elegante",
    tipo: "Landing con reservas",
    detalle: "Lo mismo, con los colores y los servicios de tu centro.",
    // Estética: piedra clara, serif fina, logo en arco y líneas delgadas.
    card: "rounded-[1.75rem] border border-[#8b7a6b]/40 bg-[#f6f1ea] group-hover:-translate-y-1.5 group-hover:border-[#a4506a]/60 group-hover:shadow-[0_20px_50px_-25px_rgba(164,80,106,0.5)]",
    panel: "rounded-t-full rounded-b-xl border border-[#8b7a6b]/30 bg-[#ead3d6]/50",
    etiqueta: "rounded-full border border-[#a4506a]/60 text-[#a4506a]",
    titulo: "editorial-titulo text-3xl font-medium text-[#2b2420]",
    estiloTxt: "editorial-texto text-sm italic text-[#a4506a]",
    detalleTxt: "editorial-texto text-sm text-[#2b2420]/70",
    cta: "editorial-texto rounded-full border border-[#a4506a] font-medium text-[#a4506a] group-hover:bg-[#a4506a] group-hover:text-[#fff]",
    adorno: null,
    href: "/estetica-demo",
    logo: "/negocios/estetica-demo/logo.svg",
    conReservas: true,
  },
  {
    rubro: "Cafetería",
    estilo: "Estilo retro, de cartel antiguo",
    tipo: "Landing simple",
    detalle: "Tu carta, tus horarios y WhatsApp. Sin reservas.",
    // Cafetería: papel crema, marco con sombra dura y letras de cartel.
    card: "rounded-lg border-2 border-[#3a2213] bg-[#f1e3c0] shadow-[5px_5px_0_#3a2213] group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:shadow-[8px_8px_0_#3a2213]",
    panel: "rounded-md border-2 border-dashed border-[#3a2213]/60 bg-[#fff6de]",
    etiqueta: "rounded-sm border-2 border-[#3a2213] bg-[#c4412a] text-[#fff4da]",
    titulo: "retro-titulo text-3xl text-[#c4412a]",
    estiloTxt: "retro-mono text-sm font-bold text-[#3a2213]",
    detalleTxt: "retro-mono text-sm text-[#3a2213]/75",
    cta: "retro-mono rounded-sm border-2 border-[#3a2213] bg-[#2f6e61] font-bold text-[#fff4da] group-hover:bg-[#245a4f]",
    adorno: null,
    href: "/cafe-demo",
    logo: "/negocios/cafe-demo/logo.svg",
    conReservas: false,
  },
];

const rubros = [
  "BARBERÍAS",
  "PELUQUERÍAS",
  "CENTROS DE ESTÉTICA",
  "DEPILACIÓN",
  "COSMETOLOGÍA",
  "SPAS",
  "CLÍNICAS MÉDICAS",
  "CONSULTORÍAS DENTALES",
  "NUTRICIÓN",
  "PSICOLOGÍA",
  "KINESIOLOGÍA",
  "UÑAS Y MASAJES",
  "TATUAJES",
  "VETERINARIAS",
  "ENTRENADORES",
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold transition-colors hover:border-accent hover:text-accent"
        >
          Escribinos
        </a>
      </header>

      <main className="flex-1 overflow-x-clip">
        <section className="relative">
          <FondoMovil />
          <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-8 lg:grid-cols-[1.25fr_1fr] lg:pt-16">
            <div>
              <Reveal y={12}>
                <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white/75">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping-soft rounded-full bg-accent" />
                    <span className="relative inline-flex size-2 rounded-full bg-accent" />
                  </span>
                  Webs con reservas online · Maldonado · Punta del Este · Piriápolis
                </p>
              </Reveal>
              <HeroTitle
                lineas={[
                  { texto: "Tu negocio," },
                  { texto: "tu web," },
                  { texto: "turnos que se reservan solos.", acento: true },
                ]}
              />
              <Reveal delay={0.9} className="mt-8 max-w-xl">
                <p className="text-lg text-white/70">
                  Hacemos la página de tu barbería, peluquería, centro de estética,
                  clínica o consultorio, y la ajustamos a tus gustos, a tus
                  colores, a tus necesidades y a tu presupuesto. Tus clientes
                  reservan desde el celular a cualquier hora, y vos dejás de
                  coordinar turnos por mensaje.
                </p>
              </Reveal>
              <Reveal delay={1} className="mt-6">
                <ul className="flex flex-wrap gap-2" aria-label="Rubros">
                  {[
                    ["Barbería", "#ffd166"],
                    ["Peluquería", "#ef8fb0"],
                    ["Estética", "#7aa7ff"],
                    ["Spa", "#b9a6e6"],
                    ["Clínica médica especializada", "#5fd3c4"],
                    ["Consultoría dental", "#8fd6ff"],
                    ["Nutrición", "#9be07a"],
                    ["Psicología", "#c9a7ff"],
                    ["Kinesiología", "#ffb27a"],
                    ["Uñas y masajes", "#ff9bb0"],
                    ["Tatuajes", "#e8e8e8"],
                    ["Veterinaria", "#ffd98a"],
                    ["Entrenadores y gimnasios", "#ff8a7a"],
                    ["Estudios profesionales", "#a9b8ff"],
                  ].map(([rubro, color]) => (
                    <li
                      key={rubro}
                      style={{
                        color,
                        borderColor: `color-mix(in srgb, ${color} 45%, transparent)`,
                        backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)`,
                      }}
                      className="rounded-full border px-3 py-1 text-xs font-bold"
                    >
                      {rubro}
                    </li>
                  ))}
                </ul>
              </Reveal>
              <Reveal delay={1.05} className="mt-7">
                <BotonesContacto />
                <a
                  href="#demos"
                  className="group mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white/75 transition-colors hover:text-accent"
                >
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping-soft rounded-full bg-accent" />
                    <span className="relative inline-flex size-2 rounded-full bg-accent" />
                  </span>
                  O probá una demo como si fueras tu cliente
                  <span aria-hidden className="transition-transform group-hover:translate-y-0.5">↓</span>
                </a>
              </Reveal>
            </div>
            <Reveal delay={0.4} y={40}>
              <PhoneDemo />
            </Reveal>
          </div>
        </section>

        <section
          aria-label="Rubros"
          className="border-y border-white/10 bg-ink-2 py-5"
        >
          <Marquee
            items={rubros}
            className="font-display text-2xl font-extrabold tracking-tight text-white/85 sm:text-4xl"
          />
          <Marquee
            items={[...rubros].reverse()}
            reverse
            className="mt-3 font-display text-2xl font-extrabold tracking-tight text-transparent [-webkit-text-stroke:1px_color-mix(in_srgb,var(--color-white)_35%,transparent)] sm:text-4xl"
          />
        </section>

        <section className="mx-auto max-w-6xl px-5 py-24">
          <Reveal>
            <h2 className="max-w-3xl font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
              Dejá de perder turnos{" "}
              <span className="text-accent">entre mensajes.</span>
            </h2>
          </Reveal>
          <div className="mt-12">
            <AntesDespues />
          </div>
          <Reveal delay={0.1}>
            <p className="mt-5 text-center text-xs text-white/35">
              Ejemplo ilustrativo.
            </p>
          </Reveal>
        </section>

        <section className="bg-ink-2 py-24">
          <div className="mx-auto max-w-6xl px-5">
            <Reveal>
              <h2 className="font-display text-4xl font-extrabold tracking-tight sm:text-6xl">
                Así trabajamos
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
                    <h3 className="mt-4 font-display text-2xl font-bold">
                      {paso.titulo}
                    </h3>
                    <p className="mt-2 text-white/65">{paso.texto}</p>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-24">
          <Reveal>
            <h2 className="font-display text-4xl font-extrabold tracking-tight sm:text-6xl">
              Dos formas de tener tu web
            </h2>
            <p className="mt-4 max-w-2xl text-lg text-white/65">
              Los precios dependen de tu negocio. Escribinos y te pasamos una
              propuesta a medida.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {planes.map((plan, i) => (
              <Reveal key={plan.nombre} delay={i * 0.12}>
                <article
                  className={`flex h-full flex-col rounded-3xl border p-8 transition-all duration-300 hover:-translate-y-1.5 ${
                    plan.destacado
                      ? "border-accent/60 bg-gradient-to-br from-accent/12 via-ink-2 to-ink-2 hover:shadow-[0_20px_60px_-20px_color-mix(in_srgb,var(--color-accent)_35%,transparent)]"
                      : "border-white/10 bg-ink-2 hover:border-white/30"
                  }`}
                >
                  {plan.destacado && (
                    <span className="mb-4 w-fit rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent-ink">
                      Lo más pedido
                    </span>
                  )}
                  <h3 className="font-display text-3xl font-bold">
                    {plan.nombre}
                  </h3>
                  <p className="mt-2 text-white/65">{plan.detalle}</p>
                  <ul className="mt-6 flex-1 space-y-3">
                    {plan.items.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span aria-hidden className="text-accent">
                          ✓
                        </span>
                        <span className="text-white/85">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-8 text-sm font-semibold uppercase tracking-wider text-white/45">
                    {plan.pago}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.1}>
            <div className="mt-6 rounded-3xl border border-white/10 bg-ink-2 p-8 md:p-10">
              <h3 className="font-display text-3xl font-bold">
                Tu web, en <span className="text-accent">tu propia dirección</span>
              </h3>
              <p className="mt-3 max-w-2xl text-white/70">
                Cada negocio tiene su dirección propia, algo como
                {" "}<span className="font-semibold text-white">tunegocio.com.uy</span>,
                {" "}y no una dirección de Tu Turno. Si ya tenés una, la
                conectamos. Si no, hay dos formas de conseguirla:
              </p>
              <ul className="mt-8 grid gap-4 md:grid-cols-2">
                {dominios.map((d) => (
                  <li
                    key={d.titulo}
                    className="rounded-2xl border border-white/10 bg-ink-3 p-6"
                  >
                    <p className="font-display text-xl font-bold">{d.titulo}</p>
                    <p className="mt-2 text-white/65">{d.texto}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm text-white/50">
                El dominio es un costo aparte del armado de tu web y se renueva
                una vez por año. Te pasamos el precio exacto en la propuesta.
              </p>
            </div>
          </Reveal>
        </section>

        {/* Las demos son lo único de la página que se puede usar: la sección se ve distinta a propósito. */}
        <section
          id="demos"
          aria-labelledby="demos-titulo"
          className="relative scroll-mt-4 overflow-hidden border-y border-accent/25 bg-ink-2 py-24"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 [background-image:radial-gradient(color-mix(in_srgb,var(--color-accent)_30%,transparent)_1px,transparent_1.5px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent_70%)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -top-40 left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-accent/15 blur-[120px]"
          />
          <div className="relative mx-auto max-w-6xl px-5">
            <Reveal>
              <p className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-accent-ink">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping-soft rounded-full bg-accent-ink/70" />
                  <span className="relative inline-flex size-2 rounded-full bg-accent-ink" />
                </span>
                Demos interactivas
              </p>
              <h2
                id="demos-titulo"
                className="mt-5 font-display text-4xl font-extrabold tracking-tight sm:text-6xl"
              >
                Probalo <span className="text-accent">vos mismo</span>
              </h2>
              <p className="mt-4 max-w-2xl text-lg text-white/70">
                Entrá a una demo y reservá un turno como lo haría tu cliente, desde el celular.
                Es todo de prueba: no se cobra nada y no le llega nada a nadie.
              </p>
              <ol className="mt-8 flex flex-col gap-3 text-sm font-semibold sm:flex-row sm:gap-6">
                {["Tocá una demo", "Apretá «Reservar»", "Elegí servicio, día y hora"].map(
                  (texto, i) => (
                    <li key={texto} className="flex items-center gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-accent/50 bg-accent/10 text-xs font-bold text-accent">
                        {i + 1}
                      </span>
                      {texto}
                    </li>
                  ),
                )}
              </ol>
            </Reveal>
            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              {demos.map((demo, i) => (
                <Reveal key={demo.rubro} delay={i * 0.12}>
                  <Link
                    href={demo.href}
                    aria-label={`Abrir la demo de ${demo.rubro.toLowerCase()}`}
                    className="group block rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                  >
                    <div
                      className={`relative flex min-h-[31rem] flex-col justify-end overflow-hidden p-6 transition duration-300 ${demo.card}`}
                    >
                      {demo.adorno}
                      <span className="absolute top-4 right-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#fff] backdrop-blur">
                        <span className="relative flex size-1.5">
                          <span className="absolute inline-flex size-full animate-ping-soft rounded-full bg-[#4ade80]" />
                          <span className="relative inline-flex size-1.5 rounded-full bg-[#4ade80]" />
                        </span>
                        En vivo
                      </span>
                      <div
                        aria-hidden
                        className={`absolute inset-x-8 top-12 flex h-[36%] items-center justify-center transition duration-300 ${demo.panel}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={demo.logo}
                          alt=""
                          className="size-24 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3"
                        />
                      </div>
                      <span
                        className={`mb-3 w-fit px-3 py-1 text-xs font-bold uppercase tracking-wider ${demo.etiqueta}`}
                      >
                        {demo.tipo}
                      </span>
                      <p className={demo.titulo}>{demo.rubro}</p>
                      <p className={`mt-1 ${demo.estiloTxt}`}>{demo.estilo}</p>
                      <p className={`mt-1 ${demo.detalleTxt}`}>{demo.detalle}</p>
                      <span
                        className={`mt-5 inline-flex min-h-11 items-center justify-center gap-2 px-5 text-sm transition duration-300 ${demo.cta}`}
                      >
                        {demo.conReservas ? "Probar reservando" : "Ver la demo"}
                        <span
                          aria-hidden
                          className="transition-transform duration-300 group-hover:translate-x-1"
                        >
                          →
                        </span>
                      </span>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
            <p className="mt-8 text-center text-sm text-white/55">
              Cada demo tiene un estilo distinto: tu web se adapta a tu marca, no al revés.
            </p>
          </div>
        </section>

        <section className="relative overflow-hidden py-28">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 -z-10 size-[40rem] -translate-x-1/2 -translate-y-1/2 animate-float-slow rounded-full bg-accent/15 blur-[130px]"
          />
          <div className="mx-auto max-w-6xl px-5 text-center">
            <Reveal>
              <h2 className="mx-auto max-w-4xl font-display text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-7xl">
                ¿Probamos con <span className="text-accent">tu negocio?</span>
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-lg text-white/65">
                Contanos qué hacés y te mostramos cómo quedaría tu web.
              </p>
              <div className="mt-10 flex justify-center">
                <BotonesContacto />
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-5 pb-24 pt-8 text-sm text-white/45">
        <p>
          Tu Turno · Maldonado, Uruguay · {TELEFONO_MOSTRADO} ·{" "}
          <a href={mailUrl} className="underline hover:text-white">
            {EMAIL}
          </a>
        </p>
      </footer>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Escribinos por WhatsApp"
        className="fixed bottom-5 right-4 z-50 flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-bold text-accent-ink shadow-[0_10px_40px_-8px_color-mix(in_srgb,var(--color-accent)_60%,transparent)] transition-transform hover:scale-105"
      >
        <span className="relative flex size-2.5">
          <span className="absolute inline-flex size-full animate-ping-soft rounded-full bg-accent-ink/60" />
          <span className="relative inline-flex size-2.5 rounded-full bg-accent-ink" />
        </span>
        WhatsApp
      </a>
    </div>
  );
}
