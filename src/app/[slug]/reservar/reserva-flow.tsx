"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Turnstile } from "@/components/turnstile";
import { DIAS_INICIALES, SelectorDia, SelectorHora } from "@/components/selector-horario";
import { linkGoogleCalendar, linkIcs } from "@/lib/calendario";
import { formatoFechaLarga, formatoInstanteLargo, listarDias } from "@/lib/fechas";
import {
  type Profesional,
  type Servicio,
  formatoDuracion,
  formatoPrecio,
} from "@/lib/negocios";
import { type Vocabulario, capitalizar } from "@/lib/vocabulario";
import {
  type ResultadoReserva,
  type Turno,
  crearReserva,
  obtenerDisponibilidad,
  obtenerHorarios,
} from "./actions";

type NegocioFlow = {
  id: string;
  slug: string;
  nombre: string;
  timezone: string;
  ventana_dias: number;
  direccion: string | null;
};

const pasosDe = (v: Vocabulario) => [capitalizar(v.servicio), "Día", "Horario", "Tus datos"];
const TELEFONO = /^\+?[0-9 ()-]{6,20}$/;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const MENSAJES_ERROR: Record<string, string> = {
  HORARIO_NO_DISPONIBLE:
    "Ese horario se acaba de ocupar. Elegí otro de los que siguen libres.",
  ANTICIPACION_INSUFICIENTE:
    "Ese horario ya no tiene tiempo de anticipación suficiente. Elegí otro.",
  FUERA_DE_HORARIO: "Ese horario no está disponible. Elegí otro.",
  FUERA_DE_VENTANA: "Esa fecha todavía no se puede reservar. Elegí otra.",
  DEMASIADAS_RESERVAS:
    "Ya tenés varias reservas activas con estos datos. Si necesitás otra, escribile al negocio.",
  TELEFONO_INVALIDO: "Revisá el teléfono: parece que no es válido.",
  EMAIL_INVALIDO: "Revisá el mail: parece que no es válido.",
  NOMBRE_INVALIDO: "Revisá tu nombre.",
  CAPTCHA: "No pudimos verificar que no sos un robot. Probá de nuevo.",
};

// Los datos del cliente quedan en su propio navegador para no tener que escribirlos la próxima vez.
const CLAVE_DATOS = "tuturno:cliente";
type DatosGuardados = { nombre: string; telefono: string; email: string };

function leerDatosGuardados(): DatosGuardados | null {
  if (typeof window === "undefined") return null;
  try {
    const crudo = window.localStorage.getItem(CLAVE_DATOS);
    return crudo ? (JSON.parse(crudo) as DatosGuardados) : null;
  } catch {
    return null;
  }
}

function guardarDatos(datos: DatosGuardados) {
  try {
    window.localStorage.setItem(CLAVE_DATOS, JSON.stringify(datos));
  } catch {
    // Sin almacenamiento (modo privado, bloqueado): la próxima vez se escriben de nuevo.
  }
}

const boton =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 font-bold transition disabled:cursor-not-allowed disabled:opacity-40";
const botonPrimario = `${boton} bg-(--n-acento) text-(--n-acento-tinta) hover:brightness-110 active:scale-[0.98]`;
const botonSecundario = `${boton} border border-(--n-texto)/20 hover:bg-(--n-texto)/5`;
const campo =
  "mt-1 w-full rounded-xl border bg-(--n-tarjeta) px-4 py-3 outline-none transition focus:border-(--n-acento) focus:ring-2 focus:ring-(--n-acento)/25";

function Tilde({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

export function ReservaFlow({
  negocio,
  servicios,
  profesionales,
  vocabulario,
  turnstileSiteKey,
}: {
  negocio: NegocioFlow;
  servicios: Servicio[];
  profesionales: Profesional[];
  vocabulario: Vocabulario;
  turnstileSiteKey: string | null;
}) {
  const [paso, setPaso] = useState(1);
  const [servicioId, setServicioId] = useState<string | null>(null);
  const [profesionalId, setProfesionalId] = useState<string | null>(null);
  const [fecha, setFecha] = useState<string | null>(null);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [cargandoTurnos, setCargandoTurnos] = useState(false);
  const [inicio, setInicio] = useState<string | null>(null);

  // Horarios libres ya consultados, por día: marcan los días sin lugar y evitan volver a pedirlos.
  const [porDia, setPorDia] = useState<Record<string, Turno[]>>({});
  const [cargandoDias, setCargandoDias] = useState(false);
  // Cada consulta lleva un número; si el cliente cambió de servicio en el medio, la respuesta vieja se descarta.
  const consulta = useRef(0);

  const [guardados] = useState(leerDatosGuardados);
  const [nombre, setNombre] = useState(guardados?.nombre ?? "");
  const [telefono, setTelefono] = useState(guardados?.telefono ?? "");
  const [email, setEmail] = useState(guardados?.email ?? "");
  const [tocados, setTocados] = useState<Record<string, boolean>>({});
  const [acepta, setAcepta] = useState(false);
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [captchaKey, setCaptchaKey] = useState(0);

  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [confirmada, setConfirmada] = useState<
    (ResultadoReserva & { ok: true }) | null
  >(null);
  const [copiado, setCopiado] = useState(false);

  const arriba = useRef<HTMLDivElement>(null);
  const primerRender = useRef(true);

  // En el celular, al cambiar de paso se vuelve al principio para que no quede a mitad de pantalla.
  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    const caja = arriba.current;
    if (caja && caja.getBoundingClientRect().top < 0) {
      caja.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [paso, confirmada]);

  const servicio = servicios.find((s) => s.id === servicioId) ?? null;
  const elegibles = useMemo(
    () => profesionales.filter((p) => servicioId && p.servicios.includes(servicioId)),
    [profesionales, servicioId],
  );
  const profesional = profesionales.find((p) => p.id === profesionalId) ?? null;

  const libres = useMemo(
    () => Object.fromEntries(Object.entries(porDia).map(([d, t]) => [d, t.length])),
    [porDia],
  );
  const primerDiaLibre = useMemo(
    () =>
      listarDias(negocio.timezone, negocio.ventana_dias + 1).find(
        (d) => (libres[d.fecha] ?? 0) > 0,
      ) ?? null,
    [libres, negocio.timezone, negocio.ventana_dias],
  );

  async function cargarDisponibilidad(desde: number, cantidad: number) {
    if (!servicioId) return;
    const numero = consulta.current;
    const fechas = listarDias(negocio.timezone, negocio.ventana_dias + 1)
      .slice(desde, desde + cantidad)
      .map((d) => d.fecha);
    if (fechas.length === 0) return;
    setCargandoDias(true);
    // De a tandas: el servidor no acepta más de un mes por pedido.
    for (let i = 0; i < fechas.length; i += 31) {
      const r = await obtenerDisponibilidad(
        negocio.id,
        servicioId,
        fechas.slice(i, i + 31),
        profesionalId,
      );
      if (numero !== consulta.current) return;
      if (r.ok) setPorDia((previo) => ({ ...previo, ...r.porDia }));
    }
    setCargandoDias(false);
  }

  async function cargarTurnos(dia: string, servicio: string, prof: string | null) {
    setCargandoTurnos(true);
    setTurnos([]);
    const r = await obtenerHorarios(negocio.id, servicio, dia, prof);
    setTurnos(r.ok ? r.turnos : []);
    if (r.ok) setPorDia((previo) => ({ ...previo, [dia]: r.turnos }));
    setCargandoTurnos(false);
    return r.ok;
  }

  // Cambiar servicio o profesional invalida lo que se sabía de los días.
  function olvidarDias() {
    consulta.current++;
    setPorDia({});
    setCargandoDias(false);
    setFecha(null);
    setInicio(null);
  }

  function elegirServicio(id: string) {
    if (id !== servicioId) olvidarDias();
    setServicioId(id);
    setProfesionalId(null);
    setAviso(null);
  }

  function elegirProfesional(id: string | null) {
    if (id !== profesionalId) olvidarDias();
    setProfesionalId(id);
  }

  function irAlPaso2() {
    setPaso(2);
    if (Object.keys(porDia).length === 0) void cargarDisponibilidad(0, DIAS_INICIALES);
  }

  async function elegirDia(dia: string) {
    if (!servicioId) return;
    setFecha(dia);
    setInicio(null);
    setAviso(null);
    setPaso(3);
    const conocidos = porDia[dia];
    if (conocidos) setTurnos(conocidos);
    else await cargarTurnos(dia, servicioId, profesionalId);
  }

  const errores = {
    nombre: nombre.trim().length < 2 ? "Escribí tu nombre." : null,
    telefono: !TELEFONO.test(telefono.trim())
      ? "Escribí un teléfono válido, por ejemplo 099 123 456."
      : null,
    email:
      email.trim() !== "" && !EMAIL.test(email.trim())
        ? "Revisá el mail, o dejalo vacío."
        : null,
  };
  const faltan = [
    errores.nombre && "tu nombre",
    errores.telefono && "un teléfono válido",
    errores.email && "un mail válido",
    !acepta && "aceptar el uso de tus datos",
    turnstileSiteKey && captcha === null && "la verificación",
  ].filter(Boolean) as string[];
  const datosValidos = faltan.length === 0;

  async function confirmar() {
    if (!servicioId || !inicio) return;
    if (!datosValidos) {
      setTocados({ nombre: true, telefono: true, email: true });
      return;
    }
    setEnviando(true);
    setAviso(null);

    const r = await crearReserva({
      negocioId: negocio.id,
      servicioId,
      profesionalId,
      inicio,
      nombre: nombre.trim(),
      telefono: telefono.trim(),
      email: email.trim(),
      captcha,
    });
    setEnviando(false);

    if (r.ok) {
      guardarDatos({ nombre: nombre.trim(), telefono: telefono.trim(), email: email.trim() });
      setConfirmada(r);
      return;
    }

    setAviso(
      MENSAJES_ERROR[r.codigo] ??
        "No pudimos guardar tu reserva. Probá de nuevo en unos minutos.",
    );
    // Si otro cliente ganó el horario, se vuelven a mostrar los que siguen libres.
    if (
      fecha &&
      ["HORARIO_NO_DISPONIBLE", "ANTICIPACION_INSUFICIENTE", "FUERA_DE_HORARIO"].includes(
        r.codigo,
      )
    ) {
      setInicio(null);
      setPaso(3);
      await cargarTurnos(fecha, servicioId, profesionalId);
    }
    setCaptcha(null);
    setCaptchaKey((k) => k + 1);
  }

  async function copiarLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // Sin permiso para el portapapeles: el link igual está a la vista para copiarlo a mano.
    }
  }

  if (confirmada && servicio) {
    const inicioIso = confirmada.inicio;
    const elegido = profesionales.find((p) => p.id === confirmada.profesionalId) ?? profesional;
    const evento = {
      titulo: `${servicio.nombre} en ${negocio.nombre}`,
      inicio: inicioIso,
      fin: confirmada.fin,
      lugar: negocio.direccion,
      detalle: `${elegido ? `Con ${elegido.nombre}. ` : ""}Para cancelar o cambiar el turno: ${confirmada.gestionUrl}`,
    };
    return (
      <div ref={arriba} className="scroll-mt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-(--n-texto)/10 bg-(--n-tarjeta) p-6 text-center sm:p-8"
        >
          <motion.span
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
            className="mx-auto flex size-16 items-center justify-center rounded-full bg-(--n-acento) text-(--n-acento-tinta)"
          >
            <Tilde className="size-8" />
          </motion.span>
          <h1 className="mt-5 text-3xl font-extrabold">¡Reserva confirmada!</h1>
          <p className="mt-2 text-(--n-texto)/70">
            Te esperamos en {negocio.nombre}.
            {email.trim() ? " Te mandamos los detalles por mail." : ""}
          </p>
          <dl className="mx-auto mt-6 max-w-sm space-y-2 rounded-2xl bg-(--n-texto)/5 p-5 text-left text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-(--n-texto)/55">{capitalizar(vocabulario.servicio)}</dt>
              <dd className="text-right font-semibold">{servicio.nombre}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-(--n-texto)/55">Cuándo</dt>
              <dd className="text-right font-semibold first-letter:uppercase">
                {formatoInstanteLargo(inicioIso, negocio.timezone)}
              </dd>
            </div>
            {elegido && (
              <div className="flex justify-between gap-4">
                <dt className="text-(--n-texto)/55">Con</dt>
                <dd className="text-right font-semibold">{elegido.nombre}</dd>
              </div>
            )}
            {negocio.direccion && (
              <div className="flex justify-between gap-4">
                <dt className="text-(--n-texto)/55">Dónde</dt>
                <dd className="text-right font-semibold">{negocio.direccion}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-(--n-texto)/55">A nombre de</dt>
              <dd className="text-right font-semibold">{nombre.trim()}</dd>
            </div>
          </dl>

          <div className="mx-auto mt-6 flex max-w-sm flex-col gap-2 sm:flex-row">
            <a
              href={linkGoogleCalendar(evento)}
              target="_blank"
              rel="noopener noreferrer"
              className={`${botonPrimario} flex-1 text-sm`}
            >
              Agregar a Google Calendar
            </a>
            <a
              href={linkIcs(evento, `${confirmada.inicio}-${negocio.slug}@tuturno`)}
              download={`turno-${negocio.slug}.ics`}
              className={`${botonSecundario} flex-1 text-sm`}
            >
              iPhone / Outlook
            </a>
          </div>

          <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-dashed border-(--n-texto)/20 p-4 text-left">
            <p className="text-sm font-semibold">¿Necesitás cancelar o cambiar el turno?</p>
            <p className="mt-1 text-sm text-(--n-texto)/60">
              Guardá este link: es la única forma de hacerlo sin llamar.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={confirmada.gestionUrl}
                className="text-sm font-semibold text-(--n-acento) underline underline-offset-2"
              >
                Abrir el link
              </a>
              <span className="text-(--n-texto)/30">·</span>
              <button
                type="button"
                onClick={() => void copiarLink(confirmada.gestionUrl)}
                className="text-sm font-semibold text-(--n-acento) underline underline-offset-2"
              >
                {copiado ? "¡Copiado!" : "Copiar link"}
              </button>
            </div>
            <span className="sr-only" aria-live="polite">
              {copiado ? "Link copiado" : ""}
            </span>
          </div>

          <div className="mt-8">
            <Link href={`/${negocio.slug}`} className={botonSecundario}>
              Volver a {negocio.nombre}
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div ref={arriba} className="scroll-mt-16">
      <ol className="mb-8 flex gap-2" aria-label="Pasos de la reserva">
        {pasosDe(vocabulario).map((nombrePaso, i) => {
          const numero = i + 1;
          const hecho = numero < paso;
          const contenido = (
            <>
              <span
                className={`block h-1 rounded-full transition-colors ${
                  numero <= paso ? "bg-(--n-acento)" : "bg-(--n-texto)/15"
                }`}
              />
              <span
                className={`mt-2 block text-xs ${
                  numero === paso ? "font-semibold" : "text-(--n-texto)/45"
                }`}
              >
                <span className="sm:hidden">{numero === paso ? nombrePaso : numero}</span>
                <span className="hidden sm:inline">
                  {numero}. {nombrePaso}
                </span>
              </span>
            </>
          );
          return (
            <li key={nombrePaso} className="flex-1" aria-current={numero === paso ? "step" : undefined}>
              {hecho ? (
                // Los pasos ya hechos se pueden tocar para volver.
                <button
                  type="button"
                  onClick={() => setPaso(numero)}
                  className="block w-full text-left hover:opacity-80"
                  aria-label={`Volver a ${nombrePaso}`}
                >
                  {contenido}
                </button>
              ) : (
                contenido
              )}
            </li>
          );
        })}
      </ol>

      {aviso && (
        <p
          role="alert"
          className="mb-6 rounded-2xl border border-(--n-error)/40 bg-(--n-error)/10 px-4 py-3 text-sm text-(--n-error)"
        >
          {aviso}
        </p>
      )}

      {/* Lo elegido hasta ahora, para no perder el hilo. */}
      {paso > 1 && paso < 4 && servicio && (
        <p className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-(--n-texto)/65">
          <span className="font-semibold text-(--n-texto)">{servicio.nombre}</span>
          <span>· {formatoDuracion(servicio.duracion_minutos)}</span>
          <span>· {formatoPrecio(servicio.precio)}</span>
          {profesional && <span>· con {profesional.nombre}</span>}
          <button
            type="button"
            onClick={() => setPaso(1)}
            className="font-semibold text-(--n-acento) underline underline-offset-2"
          >
            Cambiar
          </button>
        </p>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={paso}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.25 }}
        >
          {paso === 1 && (
            <section>
              <h1 className="text-2xl font-extrabold sm:text-3xl">{vocabulario.queQueres}</h1>
              <div className="mt-6 space-y-3">
                {servicios.map((s) => {
                  const elegido = servicioId === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => elegirServicio(s.id)}
                      aria-pressed={elegido}
                      className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${
                        elegido
                          ? "border-(--n-acento) bg-(--n-acento)/10"
                          : "border-(--n-texto)/10 bg-(--n-tarjeta) hover:border-(--n-texto)/30"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
                          elegido
                            ? "border-(--n-acento) bg-(--n-acento) text-(--n-acento-tinta)"
                            : "border-(--n-texto)/25"
                        }`}
                      >
                        {elegido && <Tilde className="size-3.5" />}
                      </span>
                      <span className="flex-1">
                        <span className="block font-bold">{s.nombre}</span>
                        <span className="text-sm text-(--n-texto)/55">
                          {formatoDuracion(s.duracion_minutos)}
                          {s.descripcion ? ` · ${s.descripcion}` : ""}
                        </span>
                      </span>
                      <span className="font-bold">{formatoPrecio(s.precio)}</span>
                    </button>
                  );
                })}
              </div>

              {servicioId && elegibles.length > 1 && (
                <div className="mt-8">
                  <h2 className="font-bold">{vocabulario.conQuien}</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      aria-pressed={profesionalId === null}
                      onClick={() => elegirProfesional(null)}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                        profesionalId === null
                          ? "border-(--n-acento) bg-(--n-acento) text-(--n-acento-tinta)"
                          : "border-(--n-texto)/20 hover:border-(--n-texto)/40"
                      }`}
                    >
                      Con quien esté libre
                    </button>
                    {elegibles.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        aria-pressed={profesionalId === p.id}
                        onClick={() => elegirProfesional(p.id)}
                        className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                          profesionalId === p.id
                            ? "border-(--n-acento) bg-(--n-acento) text-(--n-acento-tinta)"
                            : "border-(--n-texto)/20 hover:border-(--n-texto)/40"
                        }`}
                      >
                        {p.nombre}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* En el celular el botón queda pegado abajo, siempre a mano. */}
              <div className="sticky bottom-0 -mx-5 mt-8 bg-linear-to-t from-(--n-fondo) from-60% to-transparent px-5 pt-6 pb-5 sm:static sm:mx-0 sm:bg-none sm:p-0">
                <button
                  type="button"
                  disabled={!servicioId}
                  onClick={irAlPaso2}
                  className={`${botonPrimario} w-full sm:w-auto`}
                >
                  {servicio ? `Continuar con ${servicio.nombre}` : `Elegí un ${vocabulario.servicio}`}
                </button>
              </div>
            </section>
          )}

          {paso === 2 && (
            <section>
              <h1 className="text-2xl font-extrabold sm:text-3xl">¿Qué día te queda bien?</h1>
              <p className="mt-2 min-h-5 text-sm text-(--n-texto)/60" aria-live="polite">
                {cargandoDias && Object.keys(libres).length === 0 ? (
                  "Buscando los días con lugar…"
                ) : primerDiaLibre ? (
                  <>
                    Primer lugar libre:{" "}
                    <button
                      type="button"
                      onClick={() => void elegirDia(primerDiaLibre.fecha)}
                      className="font-semibold text-(--n-acento) underline underline-offset-2 first-letter:uppercase"
                    >
                      {formatoFechaLarga(primerDiaLibre.fecha)}
                    </button>
                  </>
                ) : Object.keys(libres).length > 0 && !cargandoDias ? (
                  "No quedan lugares en estos días. Probá con más fechas."
                ) : null}
              </p>
              <div className={`mt-4 transition-opacity ${cargandoDias && Object.keys(libres).length === 0 ? "opacity-60" : ""}`}>
                <SelectorDia
                  timezone={negocio.timezone}
                  ventanaDias={negocio.ventana_dias}
                  fecha={fecha}
                  onElegir={(d) => void elegirDia(d)}
                  libres={libres}
                  onVerMas={() =>
                    void cargarDisponibilidad(DIAS_INICIALES, negocio.ventana_dias + 1 - DIAS_INICIALES)
                  }
                />
              </div>
              <div className="mt-8">
                <button type="button" onClick={() => setPaso(1)} className={botonSecundario}>
                  Atrás
                </button>
              </div>
            </section>
          )}

          {paso === 3 && fecha && (
            <section>
              <h1 className="text-2xl font-extrabold sm:text-3xl">¿A qué hora?</h1>
              <p className="mt-1 first-letter:uppercase text-(--n-texto)/60">{formatoFechaLarga(fecha)}</p>

              <SelectorHora
                turnos={turnos}
                timezone={negocio.timezone}
                inicio={inicio}
                cargando={cargandoTurnos}
                onElegir={(t) => {
                  setInicio(t);
                  setAviso(null);
                  setPaso(4);
                }}
              />

              <div className="mt-8">
                <button type="button" onClick={() => setPaso(2)} className={botonSecundario}>
                  Elegir otro día
                </button>
              </div>
            </section>
          )}

          {paso === 4 && servicio && inicio && (
            <section>
              <h1 className="text-2xl font-extrabold sm:text-3xl">Tus datos</h1>
              <div className="mt-3 flex items-start justify-between gap-4 rounded-2xl border border-(--n-acento)/30 bg-(--n-acento)/[0.07] px-4 py-3 text-sm">
                <p>
                  <span className="font-bold">{servicio.nombre}</span>
                  <span className="block first-letter:uppercase text-(--n-texto)/70">
                    {formatoInstanteLargo(inicio, negocio.timezone)}
                    {profesional ? ` · con ${profesional.nombre}` : ""}
                  </span>
                </p>
                <span className="shrink-0 font-bold">{formatoPrecio(servicio.precio)}</span>
              </div>
              {guardados && (
                <p className="mt-3 text-xs text-(--n-texto)/50">
                  Completamos tus datos de la última vez. Revisá que estén bien.
                </p>
              )}

              <form
                noValidate
                className="mt-6 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  void confirmar();
                }}
              >
                <Campo
                  etiqueta="Nombre"
                  error={tocados.nombre ? errores.nombre : null}
                  id="nombre"
                >
                  <input
                    id="nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    onBlur={() => setTocados((t) => ({ ...t, nombre: true }))}
                    autoComplete="name"
                    required
                    maxLength={100}
                    aria-invalid={Boolean(tocados.nombre && errores.nombre)}
                    aria-describedby={tocados.nombre && errores.nombre ? "nombre-error" : undefined}
                    className={`${campo} ${tocados.nombre && errores.nombre ? "border-(--n-error)" : "border-(--n-texto)/15"}`}
                  />
                </Campo>
                <Campo
                  etiqueta="Teléfono"
                  ayuda="Por si el negocio necesita avisarte algo."
                  error={tocados.telefono ? errores.telefono : null}
                  id="telefono"
                >
                  <input
                    id="telefono"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    onBlur={() => setTocados((t) => ({ ...t, telefono: true }))}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    required
                    maxLength={30}
                    placeholder="099 123 456"
                    aria-invalid={Boolean(tocados.telefono && errores.telefono)}
                    aria-describedby={tocados.telefono && errores.telefono ? "telefono-error" : undefined}
                    className={`${campo} ${tocados.telefono && errores.telefono ? "border-(--n-error)" : "border-(--n-texto)/15"}`}
                  />
                </Campo>
                <Campo
                  etiqueta={
                    <>
                      Mail <span className="font-normal text-(--n-texto)/50">(opcional)</span>
                    </>
                  }
                  ayuda="Te mandamos la confirmación y un recordatorio el día antes."
                  error={tocados.email ? errores.email : null}
                  id="email"
                >
                  <input
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTocados((t) => ({ ...t, email: true }))}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    maxLength={200}
                    placeholder="tu@mail.com"
                    aria-invalid={Boolean(tocados.email && errores.email)}
                    aria-describedby={tocados.email && errores.email ? "email-error" : undefined}
                    className={`${campo} ${tocados.email && errores.email ? "border-(--n-error)" : "border-(--n-texto)/15"}`}
                  />
                </Campo>

                <label className="flex cursor-pointer items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={acepta}
                    onChange={(e) => setAcepta(e.target.checked)}
                    className="mt-0.5 size-5 shrink-0 accent-(--n-acento)"
                  />
                  <span>
                    Acepto que {negocio.nombre} use mis datos para gestionar esta reserva, según la{" "}
                    <Link
                      href="/privacidad"
                      target="_blank"
                      className="font-semibold text-(--n-acento) underline"
                    >
                      política de privacidad
                    </Link>
                    .
                  </span>
                </label>

                {turnstileSiteKey && (
                  <Turnstile key={captchaKey} siteKey={turnstileSiteKey} onToken={setCaptcha} />
                )}

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setPaso(3)}
                    className={botonSecundario}
                  >
                    Atrás
                  </button>
                  <button
                    type="submit"
                    disabled={enviando}
                    aria-disabled={!datosValidos}
                    className={`${botonPrimario} ${datosValidos ? "" : "opacity-60"}`}
                  >
                    {enviando && (
                      <span
                        aria-hidden="true"
                        className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
                      />
                    )}
                    {enviando ? "Reservando…" : "Confirmar reserva"}
                  </button>
                </div>
                {!datosValidos && (
                  <p className="text-sm text-(--n-texto)/55">Para confirmar falta {unirLista(faltan)}.</p>
                )}
              </form>
            </section>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Campo({
  etiqueta,
  ayuda,
  error,
  id,
  children,
}: {
  etiqueta: ReactNode;
  ayuda?: string;
  error: string | null;
  id: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold">
        {etiqueta}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-sm text-(--n-error)">
          {error}
        </p>
      ) : (
        ayuda && <p className="mt-1 text-xs text-(--n-texto)/50">{ayuda}</p>
      )}
    </div>
  );
}

/** ["a", "b", "c"] → "a, b y c". */
function unirLista(partes: string[]): string {
  if (partes.length <= 1) return partes.join("");
  return `${partes.slice(0, -1).join(", ")} y ${partes.at(-1)}`;
}
