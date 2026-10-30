"use client";

import { useState } from "react";
import { enviarMailPrueba } from "./actions";

export function MailPrueba({ activos }: { activos: boolean }) {
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; mensaje: string } | null>(null);

  async function probar() {
    setEnviando(true);
    setResultado(null);
    setResultado(await enviarMailPrueba());
    setEnviando(false);
  }

  return (
    <section className="mt-12 rounded-2xl border border-white/10 p-5 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold">Mails de Tu Turno</h2>
          <p className="mt-1 text-white/60">
            {activos
              ? "Encendidos: las reservas mandan mail al cliente y al negocio."
              : "Apagados: falta cargar la clave de Resend. Todo lo demás funciona igual."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void probar()}
          disabled={enviando}
          className="rounded-full border border-white/25 px-4 py-2 font-semibold hover:border-white/60 disabled:opacity-40"
        >
          {enviando ? "Enviando…" : "Enviarme un mail de prueba"}
        </button>
      </div>
      {resultado && (
        <p
          role="status"
          className={`mt-4 rounded-xl px-4 py-3 ${
            resultado.ok ? "bg-accent/10 text-white" : "bg-red-500/10 text-red-200"
          }`}
        >
          {resultado.mensaje}
        </p>
      )}
    </section>
  );
}
