/** Lo que se ve mientras carga una pantalla del panel: la forma de la página, no un texto suelto. */
export function EsqueletoPanel() {
  const bloque = "animate-pulse rounded-3xl bg-white/[0.06] motion-reduce:animate-none";
  return (
    <div aria-busy="true" aria-label="Cargando" className="mx-auto max-w-3xl px-5 pt-8">
      <div className={`h-4 w-24 ${bloque}`} />
      <div className={`mt-3 h-8 w-56 ${bloque}`} />
      <div className={`mt-8 h-36 ${bloque}`} />
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className={`h-20 ${bloque}`} />
        <div className={`h-20 ${bloque}`} />
        <div className={`h-20 ${bloque}`} />
      </div>
      <div className={`mt-8 h-28 ${bloque}`} />
      <div className={`mt-3 h-28 ${bloque}`} />
    </div>
  );
}
