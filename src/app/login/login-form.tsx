"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { entrar } from "./actions";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [ver, setVer] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar() {
    setEnviando(true);
    setError(null);
    const r = await entrar(email, contrasena);
    if (r.ok) {
      router.push(r.destino);
      router.refresh();
      return;
    }
    setEnviando(false);
    setError(r.mensaje);
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
      <label className="block">
        <span className="text-sm font-semibold">Tu contraseña</span>
        <div className="relative mt-1">
          <input
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            type={ver ? "text" : "password"}
            autoComplete="current-password"
            required
            className="w-full rounded-xl border border-white/15 bg-ink-2 py-3 pl-4 pr-20 outline-none focus:border-accent"
          />
          <button
            type="button"
            onClick={() => setVer((v) => !v)}
            aria-pressed={ver}
            className="absolute inset-y-0 right-2 my-auto h-9 rounded-lg px-3 text-sm font-semibold text-white/70 hover:text-white"
          >
            {ver ? "Ocultar" : "Ver"}
          </button>
        </div>
      </label>
      <button
        type="submit"
        disabled={enviando || email.trim() === "" || contrasena === ""}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-accent px-6 font-bold text-accent-ink transition hover:brightness-110 disabled:opacity-40"
      >
        {enviando ? "Entrando…" : "Entrar"}
      </button>
      <p className="text-sm text-white/55">
        ¿Te olvidaste la contraseña? Pedísela a quien armó tu web y te da una nueva.
      </p>
    </form>
  );
}
