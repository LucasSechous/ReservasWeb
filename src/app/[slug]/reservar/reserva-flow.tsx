"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Turnstile } from "@/components/turnstile";
import { SelectorDia, SelectorHora } from "@/components/selector-horario";
import { formatoFechaLarga, formatoInstanteLargo } from "@/lib/fechas";
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
  obtenerHorarios,
} from "./actions";

type NegocioFlow = {
  id: string;
  slug: string;
  nombre: string;
  timezone: string;
  ventana_dias: number;
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

const boton =
  "inline-flex min-h-12 items-center justify-center rounded-full px-6 font-bold transition disabled:cursor-not-allowed disabled:opacity-40";
const botonPrimario = `${boton} bg-(--n-acento) text-(--n-acento-tinta) hover:brightness-110`;
const botonSecundario = `${boton} border border-(--n-texto)/20 hover:bg-(--n-texto)/5`;

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

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [acepta, setAcepta] = useState(false);
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [captchaKey, setCaptchaKey] = useState(0);

  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [confirmada, setConfirmada] = useState<
    (ResultadoReserva & { ok: true }) | null
  >(null);

  const servicio = servicios.find((s) => s.id === servicioId) ?? null;
  const elegibles = useMemo(
    () => profesionales.filter((p) => servicioId && p.servicios.includes(servicioId)),
    [profesionales, servicioId],
  );
  const profesional = profesionales.find((p) => p.id === profesionalId) ?? null;

  async function cargarTurnos(dia: string, servicio: string, prof: string | null) {
    setCargandoTurnos(true);
    setTurnos([]);
    const r = await obtenerHorarios(negocio.id, servicio, dia, prof);
    setTurnos(r.ok ? r.turnos : []);
    setCargandoTurnos(false);
    return r.ok;
  }

  function elegirServicio(id: string) {
    setServicioId(id);
    setProfesionalId(null);
    setAviso(null);
  }

  async function elegirDia(dia: string) {
    if (!servicioId) return;
    setFecha(dia);
    setInicio(null);
    setAviso(null);
    setPaso(3);
    await cargarTurnos(dia, servicioId, profesionalId);
  }

  const datosValidos =
    nombre.trim().length >= 2 &&
    TELEFONO.test(telefono.trim()) &&
    (email.trim() === "" || EMAIL.test(email.trim())) &&
    acepta &&
    (!turnstileSiteKey || captcha !== null);

  async function confirmar() {
    if (!servicioId || !inicio || !datosValidos) return;
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

  if (confirmada && servicio) {
    const inicioIso = confirmada.inicio;
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-(--n-texto)/10 bg-(--n-tarjeta) p-8 text-center"
      >
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-(--n-acento) text-3xl font-bold text-(--n-acento-tinta)">
          ✓
        </span>
        <h1 className="mt-5 text-3xl font-extrabold">¡Reserva confirmada!</h1>
        <p className="mt-2 text-(--n-texto)/70">
          Te esperamos en {negocio.nombre}.
        </p>
        <dl className="mx-auto mt-6 max-w-sm space-y-2 rounded-2xl bg-(--n-texto)/5 p-5 text-left text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-(--n-texto)/55">{capitalizar(vocabulario.servicio)}</dt>
            <dd className="font-semibold">{servicio.nombre}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-(--n-texto)/55">Cuándo</dt>
            <dd className="text-right font-semibold capitalize">
              {formatoInstanteLargo(inicioIso, negocio.timezone)}
            </dd>
          </div>
          {profesional && (
            <div className="flex justify-between gap-4">
              <dt className="text-(--n-texto)/55">Con</dt>
              <dd className="font-semibold">{profesional.nombre}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className="text-(--n-texto)/55">A nombre de</dt>
            <dd className="font-semibold">{nombre.trim()}</dd>
          </div>
        </dl>
        <p className="mx-auto mt-6 max-w-sm text-sm text-(--n-texto)/60">
          Guardá este link: es la única forma de cancelar o cambiar tu turno.
        </p>
        <a
          href={confirmada.gestionUrl}
          className="mt-2 inline-block text-sm font-semibold text-(--n-acento) underline"
        >
          Cancelar o cambiar mi turno
        </a>
        <div className="mt-8">
          <Link href={`/${negocio.slug}`} className={botonSecundario}>
            Volver a {negocio.nombre}
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <div>
      <ol className="mb-8 flex gap-2" aria-label="Pasos de la reserva">
        {pasosDe(vocabulario).map((nombrePaso, i) => (
          <li key={nombrePaso} className="flex-1">
            <span
              className={`block h-1 rounded-full transition-colors ${
                i + 1 <= paso ? "bg-(--n-acento)" : "bg-(--n-texto)/15"
              }`}
            />
            <span
              className={`mt-2 block text-xs ${
                i + 1 === paso ? "font-semibold" : "text-(--n-texto)/45"
              }`}
              aria-current={i + 1 === paso ? "step" : undefined}
            >
              {i + 1}. {nombrePaso}
            </span>
          </li>
        ))}
      </ol>

      {aviso && (
        <p
          role="alert"
          className="mb-6 rounded-2xl border border-(--n-error)/40 bg-(--n-error)/10 px-4 py-3 text-sm text-(--n-error)"
        >
          {aviso}
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
                {servicios.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => elegirServicio(s.id)}
                    aria-pressed={servicioId === s.id}
                    className={`flex w-full items-center justify-between gap-4 rounded-2xl border p-4 text-left transition ${
                      servicioId === s.id
                        ? "border-(--n-acento) bg-(--n-acento)/10"
                        : "border-(--n-texto)/10 bg-(--n-tarjeta) hover:border-(--n-texto)/30"
                    }`}
                  >
                    <span>
                      <span className="block font-bold">{s.nombre}</span>
                      <span className="text-sm text-(--n-texto)/55">
                        {formatoDuracion(s.duracion_minutos)}
                        {s.descripcion ? ` · ${s.descripcion}` : ""}
                      </span>
                    </span>
                    <span className="font-bold">{formatoPrecio(s.precio)}</span>
                  </button>
                ))}
              </div>

              {servicioId && elegibles.length > 1 && (
                <div className="mt-8">
                  <h2 className="font-bold">{vocabulario.conQuien}</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      aria-pressed={profesionalId === null}
                      onClick={() => setProfesionalId(null)}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                        profesionalId === null
                          ? "border-(--n-acento) bg-(--n-acento) text-(--n-acento-tinta)"
                          : "border-(--n-texto)/20"
                      }`}
                    >
                      Con quien esté libre
                    </button>
                    {elegibles.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        aria-pressed={profesionalId === p.id}
                        onClick={() => setProfesionalId(p.id)}
                        className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                          profesionalId === p.id
                            ? "border-(--n-acento) bg-(--n-acento) text-(--n-acento-tinta)"
                            : "border-(--n-texto)/20"
                        }`}
                      >
                        {p.nombre}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8">
                <button
                  type="button"
                  disabled={!servicioId}
                  onClick={() => setPaso(2)}
                  className={botonPrimario}
                >
                  Continuar
                </button>
              </div>
            </section>
          )}

          {paso === 2 && (
            <section>
              <h1 className="text-2xl font-extrabold sm:text-3xl">¿Qué día te queda bien?</h1>
              <div className="mt-6">
                <SelectorDia
                  timezone={negocio.timezone}
                  ventanaDias={negocio.ventana_dias}
                  fecha={fecha}
                  onElegir={elegirDia}
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
              <p className="mt-1 capitalize text-(--n-texto)/60">{formatoFechaLarga(fecha)}</p>

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
              <p className="mt-2 rounded-2xl bg-(--n-texto)/5 px-4 py-3 text-sm">
                <span className="font-bold">{servicio.nombre}</span> ·{" "}
                <span className="capitalize">
                  {formatoInstanteLargo(inicio, negocio.timezone)}
                </span>
                {profesional ? ` · con ${profesional.nombre}` : ""}
              </p>

              <form
                className="mt-6 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  void confirmar();
                }}
              >
                <label className="block">
                  <span className="text-sm font-semibold">Nombre</span>
                  <input
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    autoComplete="name"
                    required
                    maxLength={100}
                    className="mt-1 w-full rounded-xl border border-(--n-texto)/15 bg-(--n-tarjeta) px-4 py-3 outline-none focus:border-(--n-acento)"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold">Teléfono</span>
                  <input
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    required
                    placeholder="099 123 456"
                    className="mt-1 w-full rounded-xl border border-(--n-texto)/15 bg-(--n-tarjeta) px-4 py-3 outline-none focus:border-(--n-acento)"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold">
                    Mail <span className="font-normal text-(--n-texto)/50">(para recibir la confirmación)</span>
                  </span>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="tu@mail.com"
                    className="mt-1 w-full rounded-xl border border-(--n-texto)/15 bg-(--n-tarjeta) px-4 py-3 outline-none focus:border-(--n-acento)"
                  />
                </label>

                <label className="flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={acepta}
                    onChange={(e) => setAcepta(e.target.checked)}
                    className="mt-1 size-4 accent-(--n-acento)"
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

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setPaso(3)}
                    className={botonSecundario}
                  >
                    Atrás
                  </button>
                  <button
                    type="submit"
                    disabled={!datosValidos || enviando}
                    className={botonPrimario}
                  >
                    {enviando ? "Reservando…" : "Confirmar reserva"}
                  </button>
                </div>
              </form>
            </section>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
