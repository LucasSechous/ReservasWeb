"use client";

import { motion } from "motion/react";

type Linea = { texto: string; acento?: boolean };

// Titular que entra palabra por palabra. Las palabras resaltadas llevan el color de acento.
export function HeroTitle({ lineas }: { lineas: Linea[] }) {
  let indice = 0;

  return (
    <h1 className="font-display text-[2.9rem] font-extrabold leading-[0.98] tracking-tight sm:text-7xl lg:text-8xl">
      {lineas.map((linea) => (
        <span key={linea.texto} className="block">
          {linea.texto.split(" ").map((palabra) => {
            const i = indice++;
            return (
              <span
                key={`${palabra}-${i}`}
                className="inline-block overflow-hidden align-bottom pb-[0.08em]"
              >
                <motion.span
                  className={`inline-block ${linea.acento ? "text-accent" : ""}`}
                  initial={{ y: "110%", rotate: 4 }}
                  animate={{ y: 0, rotate: 0 }}
                  transition={{
                    duration: 0.8,
                    delay: 0.15 + i * 0.07,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  {palabra}&nbsp;
                </motion.span>
              </span>
            );
          })}
        </span>
      ))}
    </h1>
  );
}
