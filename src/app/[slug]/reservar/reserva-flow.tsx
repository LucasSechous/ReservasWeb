"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Turnstile } from "@/components/turnstile";
import {
  type DiaOpcion,
  formatoFechaLarga,
  formatoHora,
  formatoInstanteLargo,
  listarDias,
} from "@/lib/fechas";
import {
  type Profesional,
  type Servicio,
  formatoDuracion,
  formatoPrecio,
} from "@/lib/negocios";
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

const PASOS = ["Servicio", "Día", "Horario", "Tus datos"];
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
const botonSecundario = `${boton} border border-white/20 hover:bg-white/5`;

export function ReservaFlow({
  negocio,
  servicios,
  profesionales,
  turnstileSiteKey,
}: {
  negocio: NegocioFlow;
  servicios: Servicio[];
  profesionales: Profesional[];
  turnstileSiteKey: string | null;
}) {
  const [paso, setPaso] = useState(1);
  const [servicioId, setServicioId] = useState<string | null>(null);
  const [profesionalId, setProfesionalId] = useState<string | null>(null);
  const [fecha, setFecha] = useState<string | null>(null);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [cargandoTurnos, setCargandoTurnos] = useState(false);
  const [inicio, setInicio] = useState<string | null>(null);
  const [verMasDias, setVerMasDias] = useState(false);

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

  const dias: DiaOpcion[] = useMemo(
    () =>
      listarDias(
        negocio.timezone,
        verMasDias ? negocio.ventana_dias + 1 : Math.min(14, negocio.ventana_dias + 1),
      ),
    [negocio.timezone, negocio.ventana_dias, verMasDias],
  );

  // Sin elegir profesional, cada hora aparece una sola vez aunque varios estén libres.
  const turnosVisibles = useMemo(() => {
    const vistos = new Set<string>();
    return turnos.filter((t) => {
      if (vistos.has(t.inicio)) return false;
      vistos.add(t.inicio);
      return true;
    });
  }, [turnos]);

  const franjas = useMemo(() => {
    const manana: Turno[] = [];
    const tarde: Turno[] = [];
    for (const t of turnosVisibles) {
      const hora = Number(formatoHora(t.inicio, negocio.timezone).slice(0, 2));
      (hora < 13 ? manana : tarde).push(t);
    }
    return [
      { nombre: "Mañana", turnos: manana },
      { nombre: "Tarde", turnos: tarde },
    ].filter((f) => f.turnos.length > 0);
  }, [turnosVisibles, negocio.timezone]);

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
        className="rounded-3xl border border-white/10 bg-(--n-tarjeta) p-8 text-center"
      >
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-(--n-acento) text-3xl font-bold text-(--n-acento-tinta)">
          ✓
        </span>
        <h1 className="mt-5 text-3xl font-extrabold">¡Reserva confirmada!</h1>
        <p className="mt-2 text-white/70">
          Te esperamos en {negocio.nombre}.
        </p>
        <dl className="mx-auto mt-6 max-w-sm space-y-2 rounded-2xl bg-white/5 p-5 text-left text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-white/55">Servicio</dt>
            <dd className="font-semibold">{servicio.nombre}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-white/55">Cuándo</dt>
            <dd className="text-right font-semibold capitalize">
              {formatoInstanteLargo(inicioIso, negocio.timezone)}
            </dd>
          </div>
          {profesional && (
            <div className="flex justify-between gap-4">
              <dt className="text-white/55">Con</dt>
              <dd className="font-semibold">{profesional.nombre}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className="text-white/55">A nombre de</dt>
            <dd className="font-semibold">{nombre.trim()}</dd>
          </div>
        </dl>
        <p className="mx-auto mt-6 max-w-sm text-sm text-white/60">
          Guardá este link: es la única forma de cancelar o liberar tu turno.
        </p>
        <Link
          href={`/cancelar/${confirmada.token}`}
          className="mt-2 inline-block break-all text-sm font-semibold text-(--n-acento) underline"
        >
          Cancelar este turno
        </Link>
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
        {PASOS.map((nombrePaso, i) => (
          <li key={nombrePaso} className="flex-1">
            <span
              className={`block h-1 rounded-full transition-colors ${
                i + 1 <= paso ? "bg-(--n-acento)" : "bg-white/15"
              }`}
            />
            <span
              className={`mt-2 block text-xs ${
                i + 1 === paso ? "font-semibold" : "text-white/45"
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
          className="mb-6 rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200"
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
              <h1 className="text-2xl font-extrabold sm:text-3xl">¿Qué querés hacerte?</h1>
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
                        : "border-white/10 bg-(--n-tarjeta) hover:border-white/30"
                    }`}
                  >
                    <span>
                      <span className="block font-bold">{s.nombre}</span>
                      <span className="text-sm text-white/55">
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
                  <h2 className="font-bold">¿Con quién?</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      aria-pressed={profesionalId === null}
                      onClick={() => setProfesionalId(null)}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                        profesionalId === null
                          ? "border-(--n-acento) bg-(--n-acento) text-(--n-acento-tinta)"
                          : "border-white/20"
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
                            : "border-white/20"
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
              <div className="mt-6 grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-7">
                {dias.map((d) => (
                  <button
                    key={d.fecha}
                    type="button"
                    onClick={() => elegirDia(d.fecha)}
                    aria-pressed={fecha === d.fecha}
                    className={`flex flex-col items-center rounded-2xl border py-3 transition ${
                      fecha === d.fecha
                        ? "border-(--n-acento) bg-(--n-acento) text-(--n-acento-tinta)"
                        : "border-white/10 bg-(--n-tarjeta) hover:border-white/30"
                    }`}
                  >
                    <span className="text-[11px] uppercase opacity-70">{d.diaSemana}</span>
                    <span className="text-lg font-extrabold">{d.numero}</span>
                    <span className="text-[11px] uppercase opacity-70">{d.mes}</span>
                  </button>
                ))}
              </div>
              {!verMasDias && negocio.ventana_dias + 1 > 14 && (
                <button
                  type="button"
                  onClick={() => setVerMasDias(true)}
                  className="mt-4 text-sm font-semibold text-(--n-acento) underline"
                >
                  Ver más fechas
                </button>
              )}
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
              <p className="mt-1 capitalize text-white/60">{formatoFechaLarga(fecha)}</p>

              {cargandoTurnos ? (
                <p className="mt-8 text-white/60">Buscando horarios libres…</p>
              ) : franjas.length === 0 ? (
                <div className="mt-8 rounded-2xl border border-white/10 bg-(--n-tarjeta) p-6">
                  <p className="font-semibold">No quedan horarios libres ese día.</p>
                  <p className="mt-1 text-sm text-white/60">Probá con otra fecha.</p>
                </div>
              ) : (
                <div className="mt-6 space-y-6">
                  {franjas.map((f) => (
                    <div key={f.nombre}>
                      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/50">
                        {f.nombre}
                      </h2>
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                        {f.turnos.map((t) => (
                          <button
                            key={t.inicio}
                            type="button"
                            aria-pressed={inicio === t.inicio}
                            onClick={() => {
                              setInicio(t.inicio);
                              setAviso(null);
                              setPaso(4);
                            }}
                            className={`rounded-xl border py-3 font-bold transition ${
                              inicio === t.inicio
                                ? "border-(--n-acento) bg-(--n-acento) text-(--n-acento-tinta)"
                                : "border-white/10 bg-(--n-tarjeta) hover:border-white/30"
                            }`}
                          >
                            {formatoHora(t.inicio, negocio.timezone)}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

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
              <p className="mt-2 rounded-2xl bg-white/5 px-4 py-3 text-sm">
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
                    className="mt-1 w-full rounded-xl border border-white/15 bg-(--n-tarjeta) px-4 py-3 outline-none focus:border-(--n-acento)"
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
                    className="mt-1 w-full rounded-xl border border-white/15 bg-(--n-tarjeta) px-4 py-3 outline-none focus:border-(--n-acento)"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold">
                    Mail <span className="font-normal text-white/50">(para recibir la confirmación)</span>
                  </span>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="tu@mail.com"
                    className="mt-1 w-full rounded-xl border border-white/15 bg-(--n-tarjeta) px-4 py-3 outline-none focus:border-(--n-acento)"
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
