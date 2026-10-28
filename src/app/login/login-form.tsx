"use client";

import { useState } from "react";
import { pedirLink } from "./actions";

export function LoginForm({ errorInicial }: { errorInicial: boolean }) {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(
    errorInicial ? "El link venció o ya se usó. Pedí uno nuevo." : null,
  );

  async function enviar() {
    setEnviando(true);
    setError(null);
    const r = await pedirLink(email);
    setEnviando(false);
    if (r.ok) setEnviado(true);
    else setError(r.mensaje);
  }

  if (enviado) {
    return (
      <div className="rounded-2xl border border-accent/40 bg-accent/10 p-6">
        <p className="text-lg font-bold">Revisá tu mail</p>
        <p className="mt-2 text-white/70">
          Si {email.trim()} tiene acceso, te mandamos un link para entrar. Abrilo desde este mismo
          dispositivo. Si no lo ves, mirá en spam.
        </p>
      </div>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void enviar();
      }}
    >
      {error && (
        <p
          role="alert"
          className="rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          {error}
        </p>
      )}
      <label className="block">
        <span className="text-sm font-semibold">Tu mail</span>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          placeholder="tu@mail.com"
          className="mt-1 w-full rounded-xl border border-white/15 bg-ink-2 px-4 py-3 outline-none focus:border-accent"
        />
      </label>
      <button
        type="submit"
        disabled={enviando || email.trim() === ""}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-accent px-6 font-bold text-accent-ink transition hover:brightness-110 disabled:opacity-40"
      >
        {enviando ? "Enviando…" : "Enviarme el link"}
      </button>
    </form>
  );
}
