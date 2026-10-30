"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cambiarContrasena } from "./actions";

const campo =
  "mt-1 w-full rounded-xl border border-white/15 bg-ink-2 px-4 py-3 outline-none focus:border-accent";

export function CambiarForm({ obligatorio }: { obligatorio: boolean }) {
  const router = useRouter();
  const [nueva, setNueva] = useState("");
  const [repetida, setRepetida] = useState("");
  const [ver, setVer] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar() {
    setEnviando(true);
    setError(null);
    const r = await cambiarContrasena(nueva, repetida);
    if (r.ok) {
      router.push("/panel");
      router.refresh();
      return;
    }
    setEnviando(false);
    setError(r.mensaje);
  }

  const tipo = ver ? "text" : "password";
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
        <span className="text-sm font-semibold">Contraseña nueva</span>
        <input
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          type={tipo}
          autoComplete="new-password"
          minLength={8}
          required
          className={campo}
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold">Repetila</span>
        <input
          value={repetida}
          onChange={(e) => setRepetida(e.target.value)}
          type={tipo}
          autoComplete="new-password"
          minLength={8}
          required
          className={campo}
        />
      </label>
      <label className="flex items-center gap-2 text-sm text-white/70">
        <input type="checkbox" checked={ver} onChange={(e) => setVer(e.target.checked)} />
        Mostrar lo que escribo
      </label>
      <button
        type="submit"
        disabled={enviando || nueva.length < 8 || repetida === ""}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-accent px-6 font-bold text-accent-ink transition hover:brightness-110 disabled:opacity-40"
      >
        {enviando
          ? "Guardando…"
          : obligatorio
            ? "Guardar y entrar a mi panel"
            : "Guardar contraseña"}
      </button>
    </form>
  );
}
