// Logo de Tu Turno: un calendario con un tilde, dibujado en vector para que se vea nítido en cualquier tamaño.
// Toma el color del texto (currentColor). El mismo trazo está en app/icon.svg, app/apple-icon.tsx y la imagen de vista previa.
export const TRAZO_CALENDARIO = ["M8 2.75v3.5", "M16 2.75v3.5", "M9 14.25l2.25 2.25 4.5-4.5"];

export function IconoCalendario({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <rect x="3.5" y="4.5" width="17" height="16.5" rx="3.5" />
      {TRAZO_CALENDARIO.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

/** Ícono + «tuturno», para encabezados. */
export function Logo() {
  return (
    <span className="inline-flex items-center gap-2 font-display text-xl font-extrabold tracking-tight">
      <IconoCalendario className="size-7 text-accent" />
      <span>
        tu<span className="text-accent">turno</span>
      </span>
    </span>
  );
}
