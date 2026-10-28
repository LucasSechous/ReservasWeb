"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { bloquearHorario } from "./actions";

const campo =
  "mt-1 w-full rounded-xl border border-white/15 bg-ink-3 px-3 py-2.5 outline-none focus:border-accent";

export function BloquearForm({
  negocioId,
  fechaInicial,
  profesionales,
}: {
  negocioId: string;
  fechaInicial: string;
  profesionales: { id: string; nombre: string }[];
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [profesionalId, setProfesionalId] = useState("todos");
  const [fecha, setFecha] = useState(fechaInicial);
  const [desde, setDesde] = useState("14:00");
  const [hasta, setHasta] = useState("19:00");
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflictos, setConflictos] = useState<number | null>(null);
  const [hecho, setHecho] = useState<string | null>(null);

  async function enviar(cancelarConflictos: boolean) {
    setEnviando(true);
    setError(null);
    setHecho(null);
    const r = await bloquearHorario({
      negocioId,
      profesionalId,
      fecha,
      desde,
      hasta,
      motivo,
      cancelarConflictos,
    });
    setEnviando(false);

    if (r.ok) {
      setConflictos(null);
      setHecho(
        r.canceladas > 0
          ? `Horario bloqueado. Se cancelaron ${r.canceladas} ${r.canceladas === 1 ? "turno" : "turnos"}.`
          : "Horario bloqueado.",
      );
      router.refresh();
      return;
    }
    setConflictos(r.conflictos ?? null);
    setError(r.mensaje);
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold hover:border-accent hover:text-accent"
      >
        Bloquear un horario
      </button>
    );
  }

  return (
    <form
      className="rounded-2xl border border-white/10 bg-ink-2 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        setConflictos(null);
        void enviar(false);
      }}
    >
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">Bloquear un horario</h2>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="text-sm text-white/55 hover:text-white"
        >
          Cerrar
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {profesionales.length > 1 && (
          <label className="block sm:col-span-2">
            <span className="text-sm font-semibold">Quién</span>
            <select
              value={profesionalId}
              onChange={(e) => setProfesionalId(e.target.value)}
              className={campo}
            >
              <option value="todos">Todo el equipo</option>
              {profesionales.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="block sm:col-span-2">
          <span className="text-sm font-semibold">Día</span>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
            className={campo}
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Desde</span>
          <input
            type="time"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            required
            className={campo}
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Hasta</span>
          <input
            type="time"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            required
            className={campo}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm font-semibold">
            Motivo <span className="font-normal text-white/50">(solo lo ves vos)</span>
          </span>
          <input
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            maxLength={200}
            placeholder="Trámite, vacaciones, feriado…"
            className={campo}
          />
        </label>
      </div>

      {error && (
        <div role="alert" className="mt-4 rounded-xl border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-200">
          <p>{error}</p>
          {conflictos !== null && (
            <div className="mt-3">
              <p className="text-red-100/80">
                Si seguís, se cancelan esos turnos y se avisa por mail a quienes dejaron el suyo.
              </p>
              <button
                type="button"
                disabled={enviando}
                onClick={() => void enviar(true)}
                className="mt-3 rounded-full bg-red-400 px-4 py-2 font-bold text-red-950 disabled:opacity-40"
              >
                Cancelar esos turnos y bloquear
              </button>
            </div>
          )}
        </div>
      )}
      {hecho && <p className="mt-4 text-sm text-accent">{hecho}</p>}

      <button
        type="submit"
        disabled={enviando}
        className="mt-5 inline-flex min-h-11 items-center rounded-full bg-accent px-6 font-bold text-accent-ink hover:brightness-110 disabled:opacity-40"
      >
        {enviando ? "Guardando…" : "Bloquear"}
      </button>
    </form>
  );
}
