"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SelectorDia, SelectorHora, type TurnoElegible } from "@/components/selector-horario";
import { formatoFechaLarga, formatoInstanteLargo } from "@/lib/fechas";
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
  "inline-flex min-h-12 items-center justify-center rounded-full px-6 font-bold transition disabled:cursor-not-allowed disabled:opacity-40";
const botonPrimario = `${boton} bg-(--n-acento) text-(--n-acento-tinta) hover:brightness-110`;
const botonSecundario = `${boton} border border-(--n-texto)/20 hover:bg-(--n-texto)/5`;

function digitosWhatsapp(telefono: string): string {
  const d = telefono.replace(/\D/g, "");
  return telefono.trim().startsWith("+") || d.startsWith("598") ? d : `598${d.replace(/^0/, "")}`;
}

type Vista = "detalle" | "reprogramar";
type Exito = "cancelado" | "reprogramado" | null;

export function GestionReserva({
  token,
  inicial,
  ventanaDias,
  maxReprogramaciones,
  etiquetaServicio,
}: {
  token: string;
  /** «Servicio», «Consulta», «Clase»… según el rubro del negocio. */
  etiquetaServicio: string;
  inicial: ReservaGestion;
  ventanaDias: number;
  maxReprogramaciones: number;
}) {
  const [reserva, setReserva] = useState(inicial);
  const [vista, setVista] = useState<Vista>("detalle");
  const [exito, setExito] = useState<Exito>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [trabajando, setTrabajando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  const [fecha, setFecha] = useState<string | null>(null);
  const [turnos, setTurnos] = useState<TurnoElegible[]>([]);
  const [cargando, setCargando] = useState(false);
  const [nuevoInicio, setNuevoInicio] = useState<string | null>(null);

  const tz = reserva.timezone;
  const cuando = formatoInstanteLargo(reserva.inicio, tz);
  const cancelada = reserva.estado === "cancelada";
  const hayAcciones = reserva.puede_cancelar || reserva.puede_reprogramar;

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

  async function elegirDia(dia: string) {
    setFecha(dia);
    setNuevoInicio(null);
    setAviso(null);
    setCargando(true);
    setTurnos([]);
    const r = await horariosParaReprogramar(token, dia);
    setTurnos(r.ok ? r.turnos : []);
    setCargando(false);
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
      return;
    }
    setAviso(ERRORES[r.codigo] ?? ERROR_GENERAL);
    // Si otro cliente ganó el horario, se vuelven a mostrar los que siguen libres.
    if (r.codigo === "HORARIO_NO_DISPONIBLE" && fecha) {
      setNuevoInicio(null);
      await elegirDia(fecha);
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

  return (
    <div>
      <Link
        href={`/${reserva.negocio_slug}`}
        className="text-sm font-semibold text-(--n-texto)/60 hover:text-(--n-texto)"
      >
        ← {reserva.negocio_nombre}
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
          <span className="text-sm capitalize text-(--n-texto)/70">Ahora es {cuando}.</span>
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
          <dl className="mt-6 space-y-2 rounded-2xl border border-(--n-texto)/10 bg-(--n-tarjeta) p-5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-(--n-texto)/55">Estado</dt>
              <dd className="font-semibold">{cancelada ? "Cancelado" : "Confirmado"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-(--n-texto)/55">Negocio</dt>
              <dd className="text-right font-semibold">{reserva.negocio_nombre}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-(--n-texto)/55">{etiquetaServicio}</dt>
              <dd className="text-right font-semibold">
                {reserva.servicio_nombre ?? "Turno"}
                {reserva.precio_final != null ? ` · ${formatoPrecio(reserva.precio_final)}` : ""}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-(--n-texto)/55">Cuándo</dt>
              <dd className="text-right font-semibold capitalize">{cuando}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-(--n-texto)/55">Con</dt>
              <dd className="font-semibold">{reserva.profesional_nombre}</dd>
            </div>
            {reserva.negocio_direccion && (
              <div className="flex justify-between gap-4">
                <dt className="text-(--n-texto)/55">Dirección</dt>
                <dd className="text-right font-semibold">{reserva.negocio_direccion}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-(--n-texto)/55">A nombre de</dt>
              <dd className="font-semibold">{reserva.cliente_nombre}</dd>
            </div>
          </dl>

          <div className="mt-8 space-y-4">
            {hayAcciones && (
              <div className="flex flex-wrap gap-3">
                {reserva.puede_reprogramar && (
                  <button
                    type="button"
                    onClick={() => {
                      setAviso(null);
                      setExito(null);
                      setVista("reprogramar");
                    }}
                    className={botonPrimario}
                  >
                    Reprogramar
                  </button>
                )}
                {reserva.puede_cancelar && (
                  <button
                    type="button"
                    onClick={() => {
                      setAviso(null);
                      setConfirmando(true);
                    }}
                    className={botonSecundario}
                  >
                    Cancelar turno
                  </button>
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
              contacto}

            {cancelada && (
              <Link href={`/${reserva.negocio_slug}/reservar`} className={botonPrimario}>
                Reservar otro turno
              </Link>
            )}
          </div>
        </>
      )}

      {vista === "reprogramar" && (
        <section className="mt-2">
          <p className="text-(--n-texto)/65">
            Ahora: <span className="font-semibold capitalize">{cuando}</span>. Elegí el día y la
            hora nuevos.
          </p>
          <div className="mt-6">
            <SelectorDia
              timezone={tz}
              ventanaDias={ventanaDias}
              fecha={fecha}
              onElegir={(d) => void elegirDia(d)}
            />
          </div>

          {fecha && (
            <div className="mt-8">
              <h2 className="text-xl font-extrabold capitalize">{formatoFechaLarga(fecha)}</h2>
              <SelectorHora
                turnos={turnos}
                timezone={tz}
                inicio={nuevoInicio}
                cargando={cargando}
                onElegir={(t) => {
                  setNuevoInicio(t);
                  setAviso(null);
                }}
              />
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setVista("detalle");
                setAviso(null);
              }}
              className={botonSecundario}
            >
              Volver
            </button>
            <button
              type="button"
              disabled={!nuevoInicio || trabajando}
              onClick={() => void reprogramar()}
              className={botonPrimario}
            >
              {trabajando
                ? "Cambiando…"
                : nuevoInicio
                  ? `Cambiar a ${formatoInstanteLargo(nuevoInicio, tz)}`
                  : "Elegí un horario"}
            </button>
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
          Tu turno del <span className="font-semibold capitalize">{cuando}</span> se cancela y el
          horario queda libre para otra persona.
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
