import { ReservaItem } from "./reserva-item";
import type { ItemOrdenado } from "./turnos";

// Los turnos de un día en orden. Si el día es hoy, una línea marca dónde estamos parados:
// arriba lo que ya empezó, abajo lo que viene.
export function ListaDelDia({
  items,
  horaAhora,
}: {
  items: ItemOrdenado[];
  /** "14:35" si el día es hoy; sin esto no se dibuja la línea. */
  horaAhora?: string;
}) {
  const primeroQueViene = horaAhora ? items.findIndex((i) => !i.empezo) : -1;
  // La línea solo aporta si separa algo: al principio del día o al final no hace falta.
  const conLinea = primeroQueViene > 0;
  const finDelDia = Boolean(horaAhora) && primeroQueViene === -1 && items.length > 0;

  return (
    <ol className="space-y-3">
      {items.map((item, i) => (
        <Fila key={item.id} item={item} lineaAntes={conLinea && i === primeroQueViene ? horaAhora : undefined} />
      ))}
      {finDelDia && horaAhora && <LineaAhora hora={horaAhora} />}
    </ol>
  );
}

function Fila({ item, lineaAntes }: { item: ItemOrdenado; lineaAntes?: string }) {
  return (
    <>
      {lineaAntes && <LineaAhora hora={lineaAntes} />}
      <ReservaItem item={item} />
    </>
  );
}

function LineaAhora({ hora }: { hora: string }) {
  return (
    <li aria-label={`Ahora, ${hora}`} className="flex items-center gap-3 py-1">
      <span className="relative flex size-2.5 shrink-0">
        <span className="absolute inset-0 animate-ping rounded-full bg-(--n-acento) opacity-60 motion-reduce:animate-none" />
        <span className="relative size-2.5 rounded-full bg-(--n-acento)" />
      </span>
      <span className="text-xs font-bold uppercase tracking-widest text-(--n-acento)">
        Ahora · {hora}
      </span>
      <span className="h-px flex-1 bg-gradient-to-r from-(--n-acento)/60 to-transparent" />
    </li>
  );
}
