"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

// Piezas de movimiento para las landings de los negocios. Cada estilo usa las que van con su carácter:
// la clásica sube palabras y traza filetes, el spa desenfoca y descubre fotos, el retro estampa y rebota.
// MotionProvider ya apaga los desplazamientos con «reducir movimiento»; lo que no es desplazamiento
// (parallax con scroll, recortes) se apaga acá a mano.

const SUAVE = [0.22, 1, 0.36, 1] as const;

/**
 * Texto que entra palabra por palabra al cargar.
 * «subir»: cada palabra sale de abajo de una máscara. «desenfoque»: aparece borrosa y se aclara.
 */
export function Palabras({
  texto,
  modo = "subir",
  delay = 0,
  paso = 0.07,
  className = "",
}: {
  texto: string;
  modo?: "subir" | "desenfoque";
  delay?: number;
  paso?: number;
  className?: string;
}) {
  const palabras = texto.split(" ");
  return (
    <span className={className}>
      {/* Los lectores de pantalla leen la frase entera, no palabra por palabra. */}
      <span className="sr-only">{texto}</span>
      <span aria-hidden>
        {palabras.map((palabra, i) =>
          modo === "subir" ? (
            <span key={`${palabra}-${i}`} className="inline-block overflow-hidden pb-[0.1em] align-bottom">
              <motion.span
                className="inline-block"
                initial={{ y: "110%" }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, delay: delay + i * paso, ease: SUAVE }}
              >
                {palabra}
                {i < palabras.length - 1 ? " " : ""}
              </motion.span>
            </span>
          ) : (
            <motion.span
              key={`${palabra}-${i}`}
              className="inline-block"
              initial={{ opacity: 0, filter: "blur(10px)", y: 8 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              transition={{ duration: 1, delay: delay + i * paso, ease: SUAVE }}
            >
              {palabra}
              {i < palabras.length - 1 ? " " : ""}
            </motion.span>
          ),
        )}
      </span>
    </span>
  );
}

/** Se mueve un poco más lento que la página al hacer scroll (efecto de profundidad). */
export function Parallax({
  children,
  distancia = 40,
  className = "",
}: {
  children: React.ReactNode;
  /** Píxeles que se desplaza en total mientras cruza la pantalla. */
  distancia?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reducir = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [-distancia / 2, distancia / 2]);
  return (
    <motion.div ref={ref} style={reducir ? undefined : { y }} className={className}>
      {children}
    </motion.div>
  );
}

/** Línea que se dibuja de un lado al otro cuando entra en pantalla (filetes, subrayados). */
export function Trazo({
  className = "",
  delay = 0,
  origen = "left",
  alCargar = false,
}: {
  className?: string;
  delay?: number;
  origen?: "left" | "center" | "right";
  /** true = se dibuja al cargar la página; si no, al entrar en pantalla. */
  alCargar?: boolean;
}) {
  const final = { scaleX: 1 };
  return (
    <motion.span
      aria-hidden
      className={`block ${className}`}
      style={{ originX: origen === "left" ? 0 : origen === "right" ? 1 : 0.5 }}
      initial={{ scaleX: 0 }}
      {...(alCargar ? { animate: final } : { whileInView: final, viewport: { once: true, margin: "-60px" } })}
      transition={{ duration: 0.9, delay, ease: SUAVE }}
    />
  );
}

/** Descubre su contenido de abajo hacia arriba (o de izquierda a derecha) como una cortina. */
export function Cortina({
  children,
  className = "",
  delay = 0,
  direccion = "arriba",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direccion?: "arriba" | "derecha";
}) {
  const reducir = useReducedMotion();
  if (reducir) return <div className={className}>{children}</div>;
  const oculto = direccion === "arriba" ? "inset(100% 0% 0% 0%)" : "inset(0% 100% 0% 0%)";
  return (
    <motion.div
      className={className}
      initial={{ clipPath: oculto }}
      whileInView={{ clipPath: "inset(0% 0% 0% 0%)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: direccion === "arriba" ? 1.1 : 1.6, delay, ease: SUAVE }}
    >
      {children}
    </motion.div>
  );
}

/** Cae como un sello: llega más grande y girado, y se asienta con un pequeño rebote. */
export function Estampa({
  children,
  className = "",
  delay = 0,
  giro = 0,
  alCargar = false,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  /** Giro final en grados (la estampa llega con unos grados de más). */
  giro?: number;
  alCargar?: boolean;
}) {
  const final = { opacity: 1, scale: 1, rotate: giro };
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 1.25, rotate: giro - 9 }}
      {...(alCargar ? { animate: final } : { whileInView: final, viewport: { once: true, margin: "-60px" } })}
      transition={{ type: "spring", stiffness: 260, damping: 16, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Entra girando y creciendo desde el centro (números, insignias). */
export function Giro({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
      whileInView={{ opacity: 1, rotate: 0, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ type: "spring", stiffness: 200, damping: 18, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Acercamiento lento de una foto al cargar, como si la cámara se alejara (efecto Ken Burns). */
export function Acercamiento({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ scale: 1.12 }}
      animate={{ scale: 1 }}
      transition={{ duration: 2.4, ease: SUAVE }}
    >
      {children}
    </motion.div>
  );
}
