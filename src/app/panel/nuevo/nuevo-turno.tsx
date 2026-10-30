"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { SelectorDia, SelectorHora } from "@/components/selector-horario";
import { formatoHora } from "@/lib/fechas";
import { agendarManual, horariosManual, type TurnoLibre } from "../actions";

type Servicio = { id: string; nombre: string; duracion_minutos: number; precio: number };
type Profesional = { id: string; nombre: string };
type Vinculo = { profesional_id: string; servicio_id: string };

const campo =
  "mt-1 w-full rounded-xl border border-(--n-texto)/15 bg-(--n-tarjeta) px-4 py-3 text-base outline-none placeholder:text-(--n-texto)/35 focus:border-(--n-acento)";

function Paso({
  numero,
  titulo,
  hecho,
  children,
}: {
  numero: number;
  titulo: string;
  hecho?: string | null;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-(--n-texto)/10 bg-(--n-texto)/[0.03] p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="flex size-8 flex-none items-center justify-center rounded-full bg-(--n-acento) text-sm font-extrabold text-(--n-acento-tinta)"
        >
          {numero}
        </span>
        <h3 className="font-display text-xl font-bold">{titulo}</h3>
        {hecho && <span className="ml-auto truncate text-sm text-(--n-texto)/60">{hecho}</span>}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function NuevoTurno({
  negocioId,
  timezone,
  ventanaDias,
  servicios,
  profesionales,
  vinculos,
  rutaAgenda,
  rutaHoy,
}: {
  negocioId: string;
  timezone: string;
  ventanaDias: number;
  servicios: Servicio[];
  profesionales: Profesional[];
  vinculos: Vinculo[];
  rutaAgenda: string;
  rutaHoy: string;
}) {
  const router = useRouter();
  const [servicioId, setServicioId] = useState<string | null>(null);
  const [profesionalId, setProfesionalId] = useState<string | null>(null); // null = cualquiera
  const [fecha, setFecha] = useState<string | null>(null);
  const [turnos, setTurnos] = useState<TurnoLibre[]>([]);
  const [cargando, setCargando] = useState(false);
  const [inicio, setInicio] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [notas, setNotas] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hecho, setHecho] = useState<{ cuando: string; nombre: string } | null>(null);

  const servicio = servicios.find((s) => s.id === servicioId) ?? null;

  // Solo se ofrecen los profesionales que hacen el servicio elegido.
  const disponibles = useMemo(() => {
    if (!servicioId) return [];
    const ids = new Set(
      vinculos.filter((v) => v.servicio_id === servicioId).map((v) => v.profesional_id),
    );
    return profesionales.filter((p) => ids.size === 0 || ids.has(p.id));
  }, [servicioId, vinculos, profesionales]);

  // Busca los horarios libres cuando se elige o cambia el día o el profesional. Si llegan respuestas
  // fuera de orden, solo vale la de la última búsqueda.
  const busqueda = useRef(0);
  async function buscar(servicio: string, dia: string, profesional: string | null) {
    const numero = ++busqueda.current;
    setCargando(true);
    setInicio(null);
    const r = await horariosManual(negocioId, servicio, dia, profesional);
    if (numero !== busqueda.current) return;
    setTurnos(r.ok ? r.turnos : []);
    setCargando(false);
  }

  function elegirServicio(id: string) {
    setServicioId(id);
    setProfesionalId(null);
    setFecha(null);
    setInicio(null);
    setTurnos([]);
  }

  async function agendar() {
    if (!servicioId || !inicio) return;
    setEnviando(true);
    setError(null);
    const r = await agendarManual({
      negocioId,
      servicioId,
      profesionalId,
      inicio,
      nombre,
      telefono,
      email,
      notas,
    });
    setEnviando(false);
    if (r.ok) {
      setHecho({
        nombre: nombre.trim(),
        cuando: `${new Intl.DateTimeFormat("es-UY", {
          weekday: "long",
          day: "numeric",
          month: "long",
          timeZone: timezone,
        }).format(new Date(r.inicio))} a las ${formatoHora(r.inicio, timezone)}`,
      });
      router.refresh();
    } else {
      setError(r.mensaje);
      // Si el horario se ocupó, se vuelve a pedir la lista para que no quede un horario viejo.
      if (fecha) {
        const l = await horariosManual(negocioId, servicioId, fecha, profesionalId);
        setTurnos(l.ok ? l.turnos : []);
        setInicio(null);
      }
    }
  }

  function otro() {
    setServicioId(null);
    setProfesionalId(null);
    setFecha(null);
    setInicio(null);
    setTurnos([]);
    setNombre("");
    setTelefono("");
    setEmail("");
    setNotas("");
    setHecho(null);
    setError(null);
  }

  if (hecho) {
    return (
      <div className="rounded-3xl border border-(--n-acento)/40 bg-(--n-acento)/10 p-6">
        <p className="font-display text-2xl font-extrabold">Turno agendado</p>
        <p className="mt-2 text-lg">
          <span className="font-bold">{hecho.nombre}</span>, {hecho.cuando}.
        </p>
        {email.trim() && (
          <p className="mt-1 text-sm text-(--n-texto)/65">
            Le mandamos la confirmación por mail, con un link para cambiarlo o cancelarlo.
          </p>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={otro}
            className="inline-flex min-h-12 items-center rounded-full bg-(--n-acento) px-6 font-bold text-(--n-acento-tinta) hover:brightness-110"
          >
            Agendar otro
          </button>
          <Link
            href={rutaAgenda}
            className="inline-flex min-h-12 items-center rounded-full border border-(--n-texto)/25 px-6 font-semibold hover:border-(--n-texto)/60"
          >
            Ver la agenda
          </Link>
          <Link
            href={rutaHoy}
            className="inline-flex min-h-12 items-center px-2 font-semibold text-(--n-texto)/70 underline"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  const horaElegida = inicio ? formatoHora(inicio, timezone) : null;

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void agendar();
      }}
    >
      <Paso numero={1} titulo="¿Qué servicio?" hecho={servicio?.nombre}>
        {servicios.length === 0 ? (
          <p className="text-(--n-texto)/65">Todavía no hay servicios cargados.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {servicios.map((s) => (
              <button
                key={s.id}
                type="button"
                aria-pressed={servicioId === s.id}
                onClick={() => elegirServicio(s.id)}
                className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-left transition ${
                  servicioId === s.id
                    ? "border-(--n-acento) bg-(--n-acento) text-(--n-acento-tinta)"
                    : "border-(--n-texto)/10 bg-(--n-tarjeta) hover:border-(--n-texto)/30"
                }`}
              >
                <span className="font-bold">{s.nombre}</span>
                <span className="flex-none text-sm opacity-75">
                  {s.duracion_minutos} min · ${Number(s.precio).toLocaleString("es-UY")}
                </span>
              </button>
            ))}
          </div>
        )}
      </Paso>

      {servicio && (
        <Paso
          numero={2}
          titulo="¿Con quién?"
          hecho={
            profesionalId ? disponibles.find((p) => p.id === profesionalId)?.nombre : "Cualquiera"
          }
        >
          <div className="flex flex-wrap gap-2">
            {[{ id: null, nombre: "Cualquiera" }, ...disponibles].map((p) => (
              <button
                key={p.id ?? "cualquiera"}
                type="button"
                aria-pressed={profesionalId === p.id}
                onClick={() => {
                  setProfesionalId(p.id);
                  setInicio(null);
                  if (servicioId && fecha) void buscar(servicioId, fecha, p.id);
                }}
                className={`min-h-11 rounded-full border px-5 text-sm font-bold transition ${
                  profesionalId === p.id
                    ? "border-(--n-acento) bg-(--n-acento) text-(--n-acento-tinta)"
                    : "border-(--n-texto)/15 bg-(--n-tarjeta) hover:border-(--n-texto)/40"
                }`}
              >
                {p.nombre}
              </button>
            ))}
          </div>
        </Paso>
      )}

      {servicio && (
        <Paso numero={3} titulo="¿Qué día y a qué hora?" hecho={horaElegida}>
          <SelectorDia
            timezone={timezone}
            ventanaDias={ventanaDias}
            fecha={fecha}
            onElegir={(f) => {
              setFecha(f);
              if (servicioId) void buscar(servicioId, f, profesionalId);
            }}
          />
          {fecha && (
            <SelectorHora
              turnos={turnos}
              timezone={timezone}
              inicio={inicio}
              cargando={cargando}
              onElegir={setInicio}
            />
          )}
        </Paso>
      )}

      {inicio && (
        <Paso numero={4} titulo="¿Para quién?">
          <label className="block">
            <span className="text-sm font-semibold">Nombre *</span>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              maxLength={100}
              autoComplete="off"
              placeholder="Ej.: Martín Pérez"
              className={campo}
            />
          </label>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold">
                Teléfono <span className="font-normal text-(--n-texto)/50">(opcional)</span>
              </span>
              <input
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                type="tel"
                inputMode="tel"
                maxLength={30}
                placeholder="099 123 456"
                className={campo}
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">
                Mail <span className="font-normal text-(--n-texto)/50">(opcional)</span>
              </span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                inputMode="email"
                maxLength={200}
                placeholder="cliente@mail.com"
                className={campo}
              />
            </label>
          </div>
          {email.trim() && (
            <p className="mt-2 text-sm text-(--n-texto)/60">
              Con mail, el cliente recibe la confirmación y un link para cambiar o cancelar.
            </p>
          )}
          <label className="mt-3 block">
            <span className="text-sm font-semibold">
              Nota <span className="font-normal text-(--n-texto)/50">(opcional)</span>
            </span>
            <input
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              maxLength={300}
              placeholder="Ej.: viene con su hijo"
              className={campo}
            />
          </label>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-2xl border border-(--n-error)/40 bg-red-500/10 px-4 py-3 text-sm text-(--n-error)"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando || nombre.trim() === ""}
            className="mt-5 inline-flex min-h-13 w-full items-center justify-center rounded-full bg-(--n-acento) px-6 text-base font-extrabold text-(--n-acento-tinta) transition hover:brightness-110 disabled:opacity-40"
          >
            {enviando ? "Agendando…" : `Agendar a las ${horaElegida}`}
          </button>
        </Paso>
      )}
    </form>
  );
}
