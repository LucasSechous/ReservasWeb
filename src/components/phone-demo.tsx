"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

const PASOS = ["Servicio", "Día", "Horario", "Listo"];

const SERVICIOS = [
  { nombre: "Corte clásico", detalle: "30 min" },
  { nombre: "Corte + barba", detalle: "45 min" },
  { nombre: "Perfilado de barba", detalle: "15 min" },
];
const DIAS = [
  { d: "Lun", n: "12" },
  { d: "Mar", n: "13" },
  { d: "Mié", n: "14" },
  { d: "Jue", n: "15" },
  { d: "Vie", n: "16" },
];
const HORAS = ["16:00", "16:30", "17:00", "17:30", "18:00", "18:30"];

function Fila({
  titulo,
  detalle,
  activo,
}: {
  titulo: string;
  detalle: string;
  activo?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition-colors ${
        activo
          ? "border-accent bg-accent/10 text-white"
          : "border-white/10 bg-white/[0.03] text-white/70"
      }`}
    >
      <span className="font-medium">{titulo}</span>
      <span className="text-xs text-white/50">{detalle}</span>
    </div>
  );
}

function Contenido({ paso }: { paso: number }) {
  if (paso === 0) {
    return (
      <div className="space-y-2.5">
        <p className="mb-3 text-xs uppercase tracking-wider text-white/45">
          ¿Qué te vas a hacer?
        </p>
        {SERVICIOS.map((s, i) => (
          <Fila key={s.nombre} titulo={s.nombre} detalle={s.detalle} activo={i === 1} />
        ))}
      </div>
    );
  }
  if (paso === 1) {
    return (
      <div>
        <p className="mb-3 text-xs uppercase tracking-wider text-white/45">
          Elegí el día
        </p>
        <div className="grid grid-cols-5 gap-2">
          {DIAS.map((dia, i) => (
            <div
              key={dia.n}
              className={`flex flex-col items-center rounded-2xl border py-3 text-sm ${
                i === 2
                  ? "border-accent bg-accent text-accent-ink"
                  : "border-white/10 bg-white/[0.03] text-white/70"
              }`}
            >
              <span className="text-[10px] uppercase opacity-70">{dia.d}</span>
              <span className="text-base font-bold">{dia.n}</span>
            </div>
          ))}
        </div>
        <p className="mt-5 text-xs text-white/40">
          Solo aparecen los días con lugar disponible.
        </p>
      </div>
    );
  }
  if (paso === 2) {
    return (
      <div>
        <p className="mb-3 text-xs uppercase tracking-wider text-white/45">
          Horarios libres
        </p>
        <div className="grid grid-cols-3 gap-2">
          {HORAS.map((h) => (
            <div
              key={h}
              className={`rounded-xl border py-2.5 text-center text-sm font-medium ${
                h === "17:30"
                  ? "border-accent bg-accent text-accent-ink"
                  : "border-white/10 bg-white/[0.03] text-white/70"
              }`}
            >
              {h}
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 pb-6 text-center">
      <motion.svg
        viewBox="0 0 52 52"
        className="size-20"
        initial="hidden"
        animate="visible"
      >
        <motion.circle
          cx="26"
          cy="26"
          r="24"
          fill="none"
          stroke="#3ddc97"
          strokeWidth="2.5"
          variants={{
            hidden: { pathLength: 0, opacity: 0 },
            visible: { pathLength: 1, opacity: 1 },
          }}
          transition={{ duration: 0.6 }}
        />
        <motion.path
          d="M15 27 L23 35 L38 18"
          fill="none"
          stroke="#3ddc97"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={{
            hidden: { pathLength: 0 },
            visible: { pathLength: 1 },
          }}
          transition={{ duration: 0.5, delay: 0.5 }}
        />
      </motion.svg>
      <div>
        <p className="font-display text-xl font-bold">¡Reserva confirmada!</p>
        <p className="mt-1 text-sm text-white/60">Corte + barba · Miércoles 17:30</p>
      </div>
      <p className="rounded-full bg-white/[0.06] px-4 py-1.5 text-xs text-white/60">
        Te mandamos la confirmación por mail
      </p>
    </div>
  );
}

// Celular que recorre, en bucle, los 4 pasos de una reserva. Es una ilustración, no un negocio real.
export function PhoneDemo() {
  const [paso, setPaso] = useState(0);
  const reducir = useReducedMotion();

  useEffect(() => {
    if (reducir) return;
    const id = setInterval(() => setPaso((p) => (p + 1) % PASOS.length), 2800);
    return () => clearInterval(id);
  }, [reducir]);

  return (
    <div className="relative mx-auto w-[268px] sm:w-[300px]">
      <div
        aria-hidden
        className="absolute -inset-8 -z-10 rounded-full bg-violeta/30 blur-3xl"
      />
      <div className="rounded-[2.6rem] border border-white/15 bg-ink-2 p-3 shadow-[0_30px_80px_-20px_rgba(70,120,230,0.45)]">
        <div className="relative flex h-[500px] flex-col overflow-hidden rounded-[2rem] bg-ink-3">
          <div className="mx-auto mt-2 h-1.5 w-16 rounded-full bg-white/15" />
          <div className="px-5 pb-3 pt-4">
            <p className="font-display text-base font-bold">Barbería Ejemplo</p>
            <p className="text-[11px] text-white/45">Reservá tu turno</p>
          </div>

          <div
            className="flex gap-1.5 px-5"
            role="tablist"
            aria-label="Pasos de la reserva"
          >
            {PASOS.map((nombre, i) => (
              <button
                key={nombre}
                type="button"
                role="tab"
                aria-selected={i === paso}
                aria-label={`Paso ${i + 1}: ${nombre}`}
                onClick={() => setPaso(i)}
                className="group flex-1 py-2"
              >
                <span
                  className={`block h-1 rounded-full transition-colors duration-500 ${
                    i <= paso ? "bg-accent" : "bg-white/15 group-hover:bg-white/30"
                  }`}
                />
                <span
                  className={`mt-1.5 block text-[10px] ${
                    i === paso ? "text-white" : "text-white/35"
                  }`}
                >
                  {nombre}
                </span>
              </button>
            ))}
          </div>

          <div className="relative flex-1 overflow-hidden px-5 pt-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={paso}
                className="h-full"
                initial={{ opacity: 0, x: 28 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -28 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <Contenido paso={paso} />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="px-5 pb-5">
            <div className="rounded-full bg-accent py-3 text-center text-sm font-bold text-accent-ink">
              {paso === 3 ? "Agregar a mi calendario" : "Continuar"}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -left-4 top-24 hidden animate-float rounded-2xl border border-white/10 bg-ink-3/90 px-3 py-2 text-xs shadow-xl backdrop-blur sm:block sm:-left-14">
        <span className="text-accent">●</span> Abierto las 24 hs
      </div>
      <div className="absolute -right-3 bottom-28 hidden animate-float-slow rounded-2xl border border-white/10 bg-ink-3/90 px-3 py-2 text-xs shadow-xl backdrop-blur sm:block sm:-right-12">
        ✉ Confirmación por mail
      </div>
    </div>
  );
}
