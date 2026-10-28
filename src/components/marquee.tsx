// Cinta de texto infinita. Se duplica el contenido para que el bucle no tenga saltos.
export function Marquee({
  items,
  reverse = false,
  className = "",
}: {
  items: string[];
  reverse?: boolean;
  className?: string;
}) {
  const fila = (copia: number) => (
    <ul
      key={copia}
      aria-hidden={copia === 1}
      className="flex shrink-0 items-center gap-8 pr-8"
    >
      {items.map((item, i) => (
        <li key={`${item}-${i}`} className="flex items-center gap-8 whitespace-nowrap">
          <span>{item}</span>
          <span className="text-accent">✦</span>
        </li>
      ))}
    </ul>
  );

  return (
    <div className={`overflow-hidden ${className}`}>
      <div
        className={`flex w-max ${reverse ? "animate-marquee-reverse" : "animate-marquee"}`}
      >
        {fila(0)}
        {fila(1)}
      </div>
    </div>
  );
}
