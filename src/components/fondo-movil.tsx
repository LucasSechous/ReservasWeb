// Fondo de las portadas: destellos de color que se mueven despacio y, si hay, un video corto
// en bucle por debajo. Los colores salen de `accent` y `violeta`, así que toma la paleta de cada negocio.
// Quien tiene el movimiento reducido en su sistema no ve el video ni las animaciones.
export function FondoMovil({ video, poster }: { video?: string; poster?: string }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {video && (
        <>
          <video
            className="absolute inset-0 size-full object-cover opacity-35 motion-reduce:hidden"
            src={video}
            poster={poster}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-(--n-fondo)/40 via-transparent to-(--n-fondo)" />
        </>
      )}
      <div className="absolute -left-32 top-0 size-[30rem] animate-drift-a rounded-full bg-violeta/30 blur-[110px]" />
      <div className="absolute -right-24 top-40 size-[26rem] animate-drift-b rounded-full bg-accent/20 blur-[110px]" />
      <div className="absolute bottom-[-8rem] left-1/3 size-[24rem] animate-drift-c rounded-full bg-violeta/20 blur-[120px]" />
      <div className="absolute inset-0 animate-spin-lento bg-[conic-gradient(from_0deg_at_70%_30%,transparent_0deg,rgba(255,255,255,0.05)_60deg,transparent_120deg)]" />
    </div>
  );
}
