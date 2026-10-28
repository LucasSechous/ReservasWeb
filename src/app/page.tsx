import {
  EMAIL,
  TELEFONO_MOSTRADO,
  mailUrl,
  whatsappUrl,
} from "@/lib/contacto";

const boton =
  "inline-flex min-h-12 items-center justify-center rounded-full px-6 text-base font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2";
const botonPrimario = `${boton} bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:outline-emerald-600`;
const botonSecundario = `${boton} border border-current/30 hover:bg-foreground/5 focus-visible:outline-foreground`;

function Contacto({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col gap-3 sm:flex-row ${className}`}>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={botonPrimario}
      >
        Escribime por WhatsApp
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

export default function Home() {
  return (
    <>
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-5">
        <span className="text-lg font-bold tracking-tight">ReservasWeb</span>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
        >
          Escribime
        </a>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-4 pb-16 pt-10 sm:pt-20">
          <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
            Páginas web con reservas online
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
            Tu negocio con su propia web, y turnos que se reservan solos.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-foreground/75">
            Hago la página de tu barbería, peluquería o centro de estética con tu
            estilo y tus colores. Tus clientes reservan desde el celular a
            cualquier hora y vos dejás de coordinar turnos por mensaje.
          </p>
          <Contacto className="mt-8" />
        </section>

        <section className="bg-foreground/[0.04]">
          <div className="mx-auto max-w-5xl px-4 py-16">
            <h2 className="max-w-2xl text-2xl font-bold sm:text-3xl">
              ¿Los turnos se te pierden entre mensajes?
            </h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                "Los turnos se piden por Instagram y WhatsApp, y a veces se pierden o se superponen.",
                "Tenés que contestar a toda hora para coordinar un corte o un tratamiento.",
                "Tu marca queda adentro de una plataforma que es de otros, no en una web que sea tuya.",
              ].map((texto) => (
                <li
                  key={texto}
                  className="rounded-2xl border border-foreground/10 bg-background p-5"
                >
                  {texto}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="text-2xl font-bold sm:text-3xl">Cómo trabajamos</h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-3">
            {pasos.map((paso, i) => (
              <li key={paso.titulo} className="flex flex-col gap-2">
                <span className="flex size-10 items-center justify-center rounded-full bg-emerald-600 font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="text-lg font-semibold">{paso.titulo}</h3>
                <p className="text-foreground/75">{paso.texto}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="bg-foreground/[0.04]">
          <div className="mx-auto max-w-5xl px-4 py-16">
            <h2 className="text-2xl font-bold sm:text-3xl">
              Dos formas de tener tu web
            </h2>
            <p className="mt-3 max-w-2xl text-foreground/75">
              Los precios dependen de tu negocio. Escribime y te paso una
              propuesta a medida.
            </p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {planes.map((plan) => (
                <article
                  key={plan.nombre}
                  className={`flex flex-col rounded-2xl border bg-background p-6 ${
                    plan.destacado
                      ? "border-emerald-600 ring-1 ring-emerald-600"
                      : "border-foreground/10"
                  }`}
                >
                  <h3 className="text-xl font-bold">{plan.nombre}</h3>
                  <p className="mt-1 text-foreground/75">{plan.detalle}</p>
                  <ul className="mt-5 flex-1 space-y-2">
                    {plan.items.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span aria-hidden className="text-emerald-600">
                          ✓
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-6 text-sm font-semibold text-foreground/60">
                    {plan.pago}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="text-2xl font-bold sm:text-3xl">Así se ve</h2>
          <p className="mt-3 max-w-2xl text-foreground/75">
            Estoy preparando demos de barberías y centros de estética para
            mostrarlas acá. Mientras tanto, te armo una con los colores y los
            servicios de tu negocio.
          </p>
        </section>

        <section className="bg-emerald-700 text-white">
          <div className="mx-auto max-w-5xl px-4 py-16">
            <h2 className="max-w-2xl text-3xl font-bold sm:text-4xl">
              ¿Probamos con tu negocio?
            </h2>
            <p className="mt-3 max-w-xl text-white/85">
              Contame qué hacés y te muestro cómo quedaría tu web.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${boton} bg-white text-emerald-800 hover:bg-emerald-50 focus-visible:outline-white`}
              >
                Escribime por WhatsApp
              </a>
              <a
                href={mailUrl}
                className={`${boton} border border-white/50 hover:bg-white/10 focus-visible:outline-white`}
              >
                Mandame un mail
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-5xl px-4 py-8 text-sm text-foreground/60">
        <p>
          ReservasWeb · Maldonado, Uruguay · {TELEFONO_MOSTRADO} ·{" "}
          <a href={mailUrl} className="underline">
            {EMAIL}
          </a>
        </p>
      </footer>
    </>
  );
}
