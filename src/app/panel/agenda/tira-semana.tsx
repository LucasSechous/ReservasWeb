import Link from "next/link";
import { formatoFechaLarga } from "@/lib/fechas";

// La semana de un vistazo: cada día con cuántos turnos tiene. Tocar un día lo abre.
const DIAS_CORTOS = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];

export function TiraSemana({
  dias,
  elegido,
  hoy,
}: {
  /** Los 7 días, de lunes a domingo. */
  dias: { fecha: string; turnos: number; href: string }[];
  elegido?: string;
  hoy: string;
}) {
  return (
    <ol className="mt-5 grid grid-cols-7 gap-1.5" aria-label="Días de la semana">
      {dias.map(({ fecha, turnos, href }, i) => {
        const esElegido = fecha === elegido;
        return (
          <li key={fecha}>
            <Link
              href={href}
              aria-current={esElegido ? "date" : undefined}
              aria-label={`${formatoFechaLarga(fecha)}: ${turnos} ${turnos === 1 ? "turno" : "turnos"}`}
              className={`flex flex-col items-center rounded-2xl py-2 transition ${
                esElegido
                  ? "bg-(--n-acento) text-(--n-acento-tinta)"
                  : fecha === hoy
                    ? "bg-(--n-acento)/10 text-(--n-texto) ring-1 ring-(--n-acento)/40"
                    : "text-(--n-texto)/80 hover:bg-(--n-texto)/10"
              } ${fecha < hoy && !esElegido ? "opacity-55" : ""}`}
            >
              <span className="text-[11px] font-semibold uppercase">{DIAS_CORTOS[i]}</span>
              <span className="font-display text-lg font-extrabold tabular-nums">
                {Number(fecha.slice(8))}
              </span>
              <span
                className={`mt-0.5 min-w-5 rounded-full px-1 text-center text-[11px] font-bold tabular-nums ${
                  turnos === 0
                    ? "opacity-0"
                    : esElegido
                      ? "bg-(--n-acento-tinta)/15"
                      : "bg-(--n-texto)/10"
                }`}
              >
                {turnos}
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
