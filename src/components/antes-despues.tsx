"use client";

import { motion } from "motion/react";

const MENSAJES = [
  { de: "cliente", texto: "Hola, ¿tenés turno para hoy?" },
  { de: "cliente", texto: "¿A qué hora abren los sábados?" },
  { de: "negocio", texto: "Perdón, recién veo tu mensaje 🙈" },
  { de: "cliente", texto: "¿Me podés cambiar el turno de mañana?" },
  { de: "negocio", texto: "A ver… ¿a qué nombre estaba?" },
];

const entrada = {
  hidden: { opacity: 0, y: 14, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

// Compara un chat de mensajes desordenado con una reserva confirmada. Es un ejemplo ilustrativo.
export function AntesDespues() {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <motion.div
        className="rounded-3xl border border-white/10 bg-ink-2 p-6"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        transition={{ staggerChildren: 0.28 }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-white/45">
          Hoy
        </p>
        <h3 className="mt-2 font-display text-2xl font-bold">
          Turnos por mensaje
        </h3>
        <div className="mt-6 space-y-2.5">
          {MENSAJES.map((m) => (
            <motion.div
              key={m.texto}
              variants={entrada}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                m.de === "cliente"
                  ? "rounded-bl-md bg-white/10"
                  : "ml-auto rounded-br-md bg-emerald-700/70"
              }`}
            >
              {m.texto}
            </motion.div>
          ))}
        </div>
        <p className="mt-6 text-sm text-white/55">
          Se piden por Instagram y WhatsApp, a toda hora, y a veces se pierden o
          se superponen.
        </p>
      </motion.div>

      <motion.div
        className="relative overflow-hidden rounded-3xl border border-accent/40 bg-gradient-to-br from-accent/15 via-ink-2 to-ink-2 p-6"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">
          Con tu web
        </p>
        <h3 className="mt-2 font-display text-2xl font-bold">
          Turnos que se reservan solos
        </h3>
        <div className="mt-6 rounded-2xl border border-white/10 bg-ink-3 p-5">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-accent text-lg font-bold text-accent-ink">
              ✓
            </span>
            <div>
              <p className="font-semibold">Reserva confirmada</p>
              <p className="text-sm text-white/55">Corte + barba · mañana 17:30</p>
            </div>
          </div>
          <div className="mt-4 flex gap-2 text-xs text-white/60">
            <span className="rounded-full bg-white/[0.07] px-3 py-1">
              Mail enviado
            </span>
            <span className="rounded-full bg-white/[0.07] px-3 py-1">
              Agenda al día
            </span>
          </div>
        </div>
        <p className="mt-6 text-sm text-white/55">
          Tu cliente elige solo, a cualquier hora, y vos te enterás cuando ya
          está en la agenda.
        </p>
      </motion.div>
    </div>
  );
}
