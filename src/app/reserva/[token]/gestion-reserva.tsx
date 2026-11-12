"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  DIAS_INICIALES,
  SelectorDia,
  SelectorHora,
  type TurnoElegible,
} from "@/components/selector-horario";
import { linkGoogleCalendar, linkIcs } from "@/lib/calendario";
import { formatoFechaLarga, formatoHora, formatoInstanteLargo, listarDias } from "@/lib/fechas";
import type { ReservaGestion } from "@/lib/gestion";
import { formatoPrecio } from "@/lib/negocios";
import { cancelarReserva, horariosParaReprogramar, reprogramarReserva } from "./actions";

const ERRORES: Record<string, string> = {
  HORARIO_NO_DISPONIBLE: "Ese horario ya no está disponible. Elegí otro de los que siguen libres.",
  MISMO_HORARIO: "Elegiste el mismo horario que ya tenés. Elegí otro.",
  FUERA_DE_VENTANA: "Ya no se puede hacer este cambio por acá.",
  YA_PASO: "Este turno ya pasó.",
  YA_CANCELADA: "Este turno ya está cancelado.",
  LIMITE_REPROGRAMACIONES: "Ya cambiaste este turno el máximo de veces.",
  SERVICIO_NO_DISPONIBLE: "Este servicio ya no está disponible para cambiar el turno.",
  NO_EXISTE: "No encontramos este turno.",
};
const ERROR_GENERAL = "No pudimos hacer el cambio. Probá de nuevo en unos minutos.";

const boton =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 font-bold transition disabled:cursor-not-allowed disabled:opacity-40";
const botonPrimario = `${boton} bg-(--n-acento) text-(--n-acento-tinta) hover:brightness-110`;
const botonSecundario = `${boton} border border-(--n-texto)/20 hover:bg-(--n-texto)/5`;

function digitosWhatsapp(telefono: string): string {
  const d = telefono.replace(/\D/g, "");
  return telefono.trim().startsWith("+") || d.startsWith("598") ? d : `598${d.replace(/^0/, "")}`;
}

/** Partes de la fecha para el bloque grande del comprobante, en hora del negocio. */
function partesFecha(instante: string, timezone: string) {
  const f = new Date(instante);
  const parte = (opciones: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("es-UY", { ...opciones, timeZone: timezone }).format(f).replace(".", "");
  return {
    diaSemana: parte({ weekday: "long" }),
    numero: parte({ day: "numeric" }),
    mes: parte({ month: "long" }),
    hora: formatoHora(instante, timezone),
  };
}

type Vista = "detalle" | "reprogramar";
type Exito = "cancelado" | "reprogramado" | null;

export function GestionReserva({
  token,
  inicial,
  ventanaDias,
  maxReprogramaciones,
  etiquetaServicio,
  logo,
}: {
  token: string;
  /** «Servicio», «Consulta», «Clase»… según el rubro del negocio. */
  etiquetaServicio: string;
  inicial: ReservaGestion;
  ventanaDias: number;
  maxReprogramaciones: number;
  logo: string | null;
}) {
  const [reserva, setReserva] = useState(inicial);
  const [vista, setVista] = useState<Vista>("detalle");
  const [exito, setExito] = useState<Exito>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [trabajando, setTrabajando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  const [fecha, setFecha] = useState<string | null>(null);
  const [nuevoInicio, setNuevoInicio] = useState<string | null>(null);
  // Horarios libres ya consultados, por día: marcan los días sin lugar y evitan volver a pedirlos.
  const [porDia, setPorDia] = useState<Record<string, TurnoElegible[]>>({});
  const [cargandoDias, setCargandoDias] = useState(false);
  const [cargandoTurnos, setCargandoTurnos] = useState(false);

  const tz = reserva.timezone;
  const cuando = formatoInstanteLargo(reserva.inicio, tz);
  const partes = partesFecha(reserva.inicio, tz);
  const cancelada = reserva.estado === "cancelada";
  const pasada = reserva.motivo === "YA_PASO";
  const hayAcciones = reserva.puede_cancelar || reserva.puede_reprogramar;
  const turnos = fecha ? (porDia[fecha] ?? []) : [];
  const mapa = reserva.negocio_direccion
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(reserva.negocio_direccion)}`
    : null;

  const libres = useMemo(
    () => Object.fromEntries(Object.entries(porDia).map(([d, t]) => [d, t.length])),
    [porDia],
  );
  const primerDiaLibre = useMemo(
    () => listarDias(tz, ventanaDias + 1).find((d) => (libres[d.fecha] ?? 0) > 0) ?? null,
    [libres, tz, ventanaDias],
  );

  async function cargarDisponibilidad(desde: number, cantidad: number) {
    const fechas = listarDias(tz, ventanaDias + 1)
      .slice(desde, desde + cantidad)
      .map((d) => d.fecha);
    if (fechas.length === 0) return;
    setCargandoDias(true);
    // De a tandas: el servidor no acepta más de un mes por pedido.
    for (let i = 0; i < fechas.length; i += 31) {
      const r = await horariosParaReprogramar(token, fechas.slice(i, i + 31));
      if (r.ok) setPorDia((previo) => ({ ...previo, ...r.porDia }));
    }
    setCargandoDias(false);
  }

  function abrirReprogramar() {
    setAviso(null);
    setExito(null);
    setVista("reprogramar");
    if (Object.keys(porDia).length === 0) void cargarDisponibilidad(0, DIAS_INICIALES);
  }

  async function cancelar() {
    setTrabajando(true);
    setAviso(null);
    const r = await cancelarReserva(token);
    setTrabajando(false);
    setConfirmando(false);
    if (r.ok) {
      setReserva(r.reserva);
      setExito("cancelado");
    } else {
      setAviso(ERRORES[r.codigo] ?? ERROR_GENERAL);
    }
  }

  async function elegirDia(dia: string, forzar = false) {
    setFecha(dia);
    setNuevoInicio(null);
    setAviso(null);
    if (porDia[dia] && !forzar) return;
    setCargandoTurnos(true);
    const r = await horariosParaReprogramar(token, [dia]);
    if (r.ok) setPorDia((previo) => ({ ...previo, ...r.porDia }));
    setCargandoTurnos(false);
  }

  async function reprogramar() {
    if (!nuevoInicio) return;
    setTrabajando(true);
    setAviso(null);
    const r = await reprogramarReserva(token, nuevoInicio);
    setTrabajando(false);
    if (r.ok) {
      setReserva(r.reserva);
      setExito("reprogramado");
      setVista("detalle");
      setFecha(null);
      setNuevoInicio(null);
      // El horario viejo quedó libre y el nuevo ocupado: lo que había consultado ya no sirve.
      setPorDia({});
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setAviso(ERRORES[r.codigo] ?? ERROR_GENERAL);
    // Si otro cliente ganó el horario, se vuelven a mostrar los que siguen libres.
    if (r.codigo === "HORARIO_NO_DISPONIBLE" && fecha) {
      await elegirDia(fecha, true);
      setAviso(ERRORES.HORARIO_NO_DISPONIBLE);
    }
  }

  const motivoSinAcciones =
    reserva.motivo === "CANCELADA"
      ? "Este turno está cancelado."
      : reserva.motivo === "YA_PASO"
        ? "Este turno ya pasó."
        : reserva.motivo === "FUERA_DE_VENTANA"
          ? `Ya no se puede cancelar ni cambiar por acá: faltan menos de ${reserva.horas_min_cambio} ${reserva.horas_min_cambio === 1 ? "hora" : "horas"}.`
          : null;

  const evento = {
    titulo: `${reserva.servicio_nombre ?? "Turno"} en ${reserva.negocio_nombre}`,
    inicio: reserva.inicio,
    fin: reserva.fin,
    lugar: reserva.negocio_direccion,
    detalle: `Con ${reserva.profesional_nombre}.`,
  };

  const contacto = (
    <div className="rounded-2xl border border-(--n-texto)/10 bg-(--n-tarjeta) p-5 text-sm">
      <p className="font-semibold">Si necesitás hacer un cambio, escribile al negocio:</p>
      <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {reserva.negocio_telefono && (
          <>
            <span>{reserva.negocio_telefono}</span>
            <a
              href={`https://wa.me/${digitosWhatsapp(reserva.negocio_telefono)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-(--n-acento) underline"
            >
              WhatsApp
            </a>
          </>
        )}
        {reserva.negocio_email && <span>{reserva.negocio_email}</span>}
        {!reserva.negocio_telefono && !reserva.negocio_email && (
          <span className="text-(--n-texto)/60">{reserva.negocio_nombre}</span>
        )}
      </p>
    </div>
  );

  const botonCambiar = (
    <button
      type="button"
      disabled={!nuevoInicio || trabajando}
      onClick={() => void reprogramar()}
      className={`${botonPrimario} w-full sm:w-auto`}
    >
      {trabajando ? "Cambiando…" : nuevoInicio ? "Confirmar el cambio" : "Elegí un horario"}
    </button>
  );

  return (
    <div>
      <Link
        href={`/${reserva.negocio_slug}`}
        className="inline-flex items-center gap-3 text-sm font-semibold text-(--n-texto)/70 hover:text-(--n-texto)"
      >
        {logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" className="size-9" />
        )}
        <span>
          <span aria-hidden>← </span>
          {reserva.negocio_nombre}
        </span>
      </Link>

      <h1 className="mt-6 text-3xl font-extrabold">
        {vista === "reprogramar" ? "Cambiar mi turno" : "Tu turno"}
      </h1>

      {exito === "cancelado" && (
        <p
          role="status"
          className="mt-4 rounded-2xl border border-(--n-acento)/50 bg-(--n-acento)/10 p-4"
        >
          <span className="block font-bold">Listo, cancelamos tu turno.</span>
          <span className="text-sm text-(--n-texto)/70">El horario volvió a quedar libre.</span>
        </p>
      )}
      {exito === "reprogramado" && (
        <p
          role="status"
          className="mt-4 rounded-2xl border border-(--n-acento)/50 bg-(--n-acento)/10 p-4"
        >
          <span className="block font-bold">Listo, cambiamos tu turno.</span>
          <span className="text-sm text-(--n-texto)/70">
            Si lo habías agendado, agregá el nuevo horario a tu calendario.
          </span>
        </p>
      )}
      {aviso && (
        <p
          role="alert"
          className="mt-4 rounded-2xl border border-(--n-error)/40 bg-(--n-error)/10 px-4 py-3 text-sm text-(--n-error)"
        >
          {aviso}
        </p>
      )}

      {vista === "detalle" && (
        <>
          {/* Comprobante: fecha grande a la izquierda y los datos del turno a la derecha. */}
          <div
            className={`mt-6 overflow-hidden rounded-3xl border border-(--n-texto)/10 bg-(--n-tarjeta) ${cancelada ? "opacity-75" : ""}`}
          >
            <div className="flex items-stretch">
              <div
                className={`flex w-28 shrink-0 flex-col items-center justify-center px-3 py-6 text-center sm:w-32 ${
                  cancelada
                    ? "bg-(--n-texto)/10 text-(--n-texto)/60"
                    : "bg-(--n-acento) text-(--n-acento-tinta)"
                }`}
              >
                <span className="text-xs font-semibold uppercase tracking-wider opacity-80">
                  {partes.diaSemana}
                </span>
                <span className={`text-5xl font-extrabold leading-none ${cancelada ? "line-through" : ""}`}>
                  {partes.numero}
                </span>
                <span className="mt-1 text-xs font-semibold uppercase tracking-wider opacity-80">
                  {partes.mes}
                </span>
                <span className="mt-3 rounded-full bg-black/15 px-3 py-1 text-sm font-bold">
                  {partes.hora}
                </span>
              </div>
              <div className="min-w-0 flex-1 p-5">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${
                    cancelada
                      ? "bg-(--n-error)/15 text-(--n-error)"
                      : pasada
                        ? "bg-(--n-texto)/10 text-(--n-texto)/70"
                        : "bg-(--n-acento)/15 text-(--n-acento)"
                  }`}
                >
                  <span aria-hidden className="size-1.5 rounded-full bg-current" />
                  {cancelada ? "Cancelado" : pasada ? "Ya pasó" : "Confirmado"}
                </span>
                <p className="mt-3 text-lg font-bold leading-snug">
                  {reserva.servicio_nombre ?? "Turno"}
                </p>
                <p className="mt-1 text-sm text-(--n-texto)/65">
                  Con {reserva.profesional_nombre}
                  {reserva.precio_final != null ? ` · ${formatoPrecio(reserva.precio_final)}` : ""}
                </p>
              </div>
            </div>
            <dl className="space-y-2 border-t border-dashed border-(--n-texto)/15 p-5 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-(--n-texto)/55">{etiquetaServicio}</dt>
                <dd className="text-right font-semibold">{reserva.servicio_nombre ?? "Turno"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-(--n-texto)/55">Cuándo</dt>
                <dd className="text-right font-semibold first-letter:uppercase">{cuando}</dd>
              </div>
              {reserva.negocio_direccion && (
                <div className="flex justify-between gap-4">
                  <dt className="text-(--n-texto)/55">Dónde</dt>
                  <dd className="text-right font-semibold">
                    {mapa ? (
                      <a
                        href={mapa}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline decoration-(--n-acento) underline-offset-2"
                      >
                        {reserva.negocio_direccion}
                      </a>
                    ) : (
                      reserva.negocio_direccion
                    )}
                  </dd>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <dt className="text-(--n-texto)/55">A nombre de</dt>
                <dd className="text-right font-semibold">{reserva.cliente_nombre}</dd>
              </div>
            </dl>
          </div>

          {!cancelada && !pasada && (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <a
                href={linkGoogleCalendar(evento)}
                target="_blank"
                rel="noopener noreferrer"
                className={`${botonSecundario} flex-1 text-sm`}
              >
                Agregar a Google Calendar
              </a>
              <a
                href={linkIcs(evento, `${reserva.reserva_id}@tuturno`)}
                download={`turno-${reserva.negocio_slug}.ics`}
                className={`${botonSecundario} flex-1 text-sm`}
              >
                iPhone / Outlook
              </a>
            </div>
          )}

          <div className="mt-8 space-y-4">
            {hayAcciones && (
              <div className="rounded-3xl border border-(--n-texto)/10 p-5">
                <p className="font-bold">¿No llegás?</p>
                <p className="mt-1 text-sm text-(--n-texto)/65">
                  {reserva.puede_reprogramar
                    ? "Cambialo a otro día u hora en un minuto, o cancelalo para que el lugar le quede a otra persona."
                    : "Cancelalo para que el lugar le quede a otra persona."}
                </p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  {reserva.puede_reprogramar && (
                    <button type="button" onClick={abrirReprogramar} className={`${botonPrimario} sm:flex-1`}>
                      Cambiar día u hora
                    </button>
                  )}
                  {reserva.puede_cancelar && (
                    <button
                      type="button"
                      onClick={() => {
                        setAviso(null);
                        setConfirmando(true);
                      }}
                      className={`${botonSecundario} sm:flex-1`}
                    >
                      Cancelar turno
                    </button>
                  )}
                </div>
                {reserva.puede_reprogramar && reserva.reprogramaciones > 0 && (
                  <p className="mt-3 text-xs text-(--n-texto)/55">
                    Lo cambiaste {reserva.reprogramaciones} de {maxReprogramaciones} veces posibles.
                  </p>
                )}
              </div>
            )}

            {reserva.puede_cancelar &&
              !reserva.puede_reprogramar &&
              reserva.motivo === "LIMITE_REPROGRAMACIONES" && (
                <p className="text-sm text-(--n-texto)/65">
                  Ya cambiaste este turno {maxReprogramaciones} veces, que es el máximo. Todavía lo
                  podés cancelar.
                </p>
              )}

            {!hayAcciones && motivoSinAcciones && (
              <p className="rounded-2xl border border-(--n-texto)/10 bg-(--n-tarjeta) p-5">
                {motivoSinAcciones}
              </p>
            )}

            {(!hayAcciones || reserva.motivo === "LIMITE_REPROGRAMACIONES") &&
              !cancelada &&
              !pasada &&
              contacto}

            {(cancelada || pasada) && (
              <Link href={`/${reserva.negocio_slug}/reservar`} className={`${botonPrimario} w-full`}>
                Reservar otro turno
              </Link>
            )}
          </div>
        </>
      )}

      {vista === "reprogramar" && (
        <section className="mt-2">
          <p className="text-(--n-texto)/65">
            Tu turno ahora es el <span className="font-semibold">{cuando}</span>. Elegí el día y la
            hora nuevos.
          </p>

          <p className="mt-6 min-h-5 text-sm text-(--n-texto)/60" aria-live="polite">
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
          <div
            className={`mt-3 transition-opacity ${cargandoDias && Object.keys(libres).length === 0 ? "opacity-60" : ""}`}
          >
            <SelectorDia
              timezone={tz}
              ventanaDias={ventanaDias}
              fecha={fecha}
              onElegir={(d) => void elegirDia(d)}
              libres={libres}
              onVerMas={() => void cargarDisponibilidad(DIAS_INICIALES, ventanaDias + 1 - DIAS_INICIALES)}
            />
          </div>

          {fecha && (
            <div className="mt-8">
              <h2 className="text-xl font-extrabold first-letter:uppercase">{formatoFechaLarga(fecha)}</h2>
              <SelectorHora
                turnos={turnos}
                timezone={tz}
                inicio={nuevoInicio}
                cargando={cargandoTurnos}
                onElegir={(t) => {
                  setNuevoInicio(t);
                  setAviso(null);
                }}
              />
            </div>
          )}

          {nuevoInicio && (
            <div className="mt-8 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-3xl border border-(--n-acento)/40 bg-(--n-acento)/[0.07] p-5 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-(--n-texto)/55">Antes</p>
                <p className="mt-1 font-semibold text-(--n-texto)/60 line-through first-letter:uppercase">
                  {cuando}
                </p>
              </div>
              <span aria-hidden className="text-xl text-(--n-acento)">
                →
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-(--n-acento)">Ahora</p>
                <p className="mt-1 font-bold first-letter:uppercase">{formatoInstanteLargo(nuevoInicio, tz)}</p>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setVista("detalle");
                setAviso(null);
                setNuevoInicio(null);
              }}
              className={botonSecundario}
            >
              Volver
            </button>
            <div className="hidden sm:block">{botonCambiar}</div>
          </div>

          {/* En el celular, el botón de confirmar queda siempre a mano. */}
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-(--n-texto)/10 bg-(--n-fondo)/95 px-5 py-3 backdrop-blur sm:hidden">
            {botonCambiar}
          </div>
        </section>
      )}

      {confirmando && (
        <DialogoCancelar
          cuando={cuando}
          trabajando={trabajando}
          onConfirmar={() => void cancelar()}
          onCerrar={() => setConfirmando(false)}
        />
      )}
    </div>
  );
}

function DialogoCancelar({
  cuando,
  trabajando,
  onConfirmar,
  onCerrar,
}: {
  cuando: string;
  trabajando: boolean;
  onConfirmar: () => void;
  onCerrar: () => void;
}) {
  const volver = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    volver.current?.focus();
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [onCerrar]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end bg-black/70 p-4 sm:place-items-center"
      onClick={onCerrar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-cancelar"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl border border-(--n-texto)/10 bg-(--n-tarjeta) p-6"
      >
        <h2 id="titulo-cancelar" className="text-xl font-extrabold">
          ¿Cancelar tu turno?
        </h2>
        <p className="mt-2 text-sm text-(--n-texto)/70">
          Tu turno del <span className="font-semibold">{cuando}</span> se cancela y el horario queda
          libre para otra persona.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
          <button
            type="button"
            onClick={onConfirmar}
            disabled={trabajando}
            className={botonPrimario}
          >
            {trabajando ? "Cancelando…" : "Sí, cancelar"}
          </button>
          <button ref={volver} type="button" onClick={onCerrar} className={botonSecundario}>
            No, mantenerlo
          </button>
        </div>
      </div>
    </div>
  );
}
