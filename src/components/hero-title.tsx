type Linea = { texto: string; acento?: boolean };

// Titular que entra palabra por palabra (con CSS, para que se vea sin esperar al JavaScript).
// Las palabras resaltadas llevan el color de acento.
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
                <span
                  className={`palabra-subir ${linea.acento ? "text-accent" : ""}`}
                  style={
                    {
                      "--retraso": `${0.15 + i * 0.07}s`,
                      "--giro-inicial": "4deg",
                    } as React.CSSProperties
                  }
                >
                  {palabra}&nbsp;
                </span>
              </span>
            );
          })}
        </span>
      ))}
    </h1>
  );
}
