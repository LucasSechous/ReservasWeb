import { AntesDespues } from "@/components/antes-despues";
import { HeroTitle } from "@/components/hero-title";
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
const botonPrimario = `${boton} bg-accent text-accent-ink hover:-translate-y-0.5 hover:shadow-[0_10px_40px_-8px_rgba(200,255,58,0.6)]`;
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
        Escribime por WhatsApp <Flecha />
      </a>
      <a href={mailUrl} className={botonSecundario}>
        Mandame un mail
      </a>
    </div>
  );
}

const pasos = [
  {
    titulo: "Me contás de tu negocio",
    texto:
      "Por WhatsApp o por mail. Con tu nombre, tus servicios y tu Instagram me alcanza para empezar.",
  },
  {
    titulo: "Te muestro cómo quedaría",
    texto:
      "Armo una demo con tus colores, tu estilo y tus servicios, para que la veas en tu celular antes de decidir.",
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

const demos = [
  { rubro: "Barbería", clase: "from-violeta/40 to-ink-3" },
  { rubro: "Centro de estética", clase: "from-accent/25 to-ink-3" },
  { rubro: "Peluquería", clase: "from-emerald-500/25 to-ink-3" },
];

const rubros = [
  "BARBERÍAS",
  "PELUQUERÍAS",
  "CENTROS DE ESTÉTICA",
  "DEPILACIÓN",
  "COSMETOLOGÍA",
  "SPAS",
];

export default function Home() {
  return (
    <>
      <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
        <span className="font-display text-xl font-extrabold tracking-tight">
          reservas<span className="text-accent">web</span>
        </span>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold transition-colors hover:border-accent hover:text-accent"
        >
          Escribime
        </a>
      </header>

      <main className="flex-1 overflow-x-clip">
        <section className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute -left-32 top-10 -z-10 size-[28rem] animate-float-slow rounded-full bg-violeta/25 blur-[110px]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 top-64 -z-10 size-[24rem] animate-float rounded-full bg-accent/15 blur-[110px]"
          />
          <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-8 lg:grid-cols-[1.25fr_1fr] lg:pt-16">
            <div>
              <Reveal y={12}>
                <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white/75">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping-soft rounded-full bg-accent" />
                    <span className="relative inline-flex size-2 rounded-full bg-accent" />
                  </span>
                  Webs con reservas online · Maldonado
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
                  Hago la página de tu barbería, peluquería o centro de estética
                  con tu estilo y tus colores. Tus clientes reservan desde el
                  celular a cualquier hora, y vos dejás de coordinar turnos por
                  mensaje.
                </p>
              </Reveal>
              <Reveal delay={1.05} className="mt-9">
                <BotonesContacto />
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
            className="mt-3 font-display text-2xl font-extrabold tracking-tight text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.35)] sm:text-4xl"
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
              Los precios dependen de tu negocio. Escribime y te paso una
              propuesta a medida.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {planes.map((plan, i) => (
              <Reveal key={plan.nombre} delay={i * 0.12}>
                <article
                  className={`flex h-full flex-col rounded-3xl border p-8 transition-all duration-300 hover:-translate-y-1.5 ${
                    plan.destacado
                      ? "border-accent/60 bg-gradient-to-br from-accent/12 via-ink-2 to-ink-2 hover:shadow-[0_20px_60px_-20px_rgba(200,255,58,0.35)]"
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
        </section>

        <section className="bg-ink-2 py-24">
          <div className="mx-auto max-w-6xl px-5">
            <Reveal>
              <h2 className="font-display text-4xl font-extrabold tracking-tight sm:text-6xl">
                Así se ve
              </h2>
              <p className="mt-4 max-w-2xl text-lg text-white/65">
                Estoy preparando demos de barberías, peluquerías y centros de
                estética para mostrarlas acá. Mientras tanto, te armo una con
                los colores y los servicios de tu negocio.
              </p>
            </Reveal>
            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              {demos.map((demo, i) => (
                <Reveal key={demo.rubro} delay={i * 0.12}>
                  <div
                    className={`relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b ${demo.clase} p-6`}
                  >
                    <div
                      aria-hidden
                      className="absolute inset-x-8 top-8 h-1/2 rounded-2xl border border-white/10 bg-white/[0.04]"
                    />
                    <p className="font-display text-2xl font-bold">
                      {demo.rubro}
                    </p>
                    <p className="mt-1 text-sm text-white/55">
                      Demo en preparación
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
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
                Contame qué hacés y te muestro cómo quedaría tu web.
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
          ReservasWeb · Maldonado, Uruguay · {TELEFONO_MOSTRADO} ·{" "}
          <a href={mailUrl} className="underline hover:text-white">
            {EMAIL}
          </a>
        </p>
      </footer>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Escribime por WhatsApp"
        className="fixed bottom-5 right-4 z-50 flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-bold text-accent-ink shadow-[0_10px_40px_-8px_rgba(200,255,58,0.6)] transition-transform hover:scale-105"
      >
        <span className="relative flex size-2.5">
          <span className="absolute inline-flex size-full animate-ping-soft rounded-full bg-accent-ink/60" />
          <span className="relative inline-flex size-2.5 rounded-full bg-accent-ink" />
        </span>
        WhatsApp
      </a>
    </>
  );
}
