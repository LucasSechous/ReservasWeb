"use client";

import { motion } from "motion/react";

// Aparece con un fundido y un leve desplazamiento cuando entra en pantalla.
export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Igual que Reveal, pero para lo que se ve apenas abre la página: se anima con CSS desde el primer
 * pintado, sin esperar al JavaScript (si esperara, el texto principal tardaría en aparecer).
 */
export function Entrada({
  children,
  delay = 0,
  y = 28,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <div
      className={`entrada ${className}`}
      style={{ "--retraso": `${delay}s`, "--y": `${y}px` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
