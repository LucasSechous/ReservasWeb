import Image from "next/image";
import { Reveal } from "@/components/reveal";

export type Foto = { src: string; alt: string };

// Mosaico de fotos del negocio. Se repite un patrón de tres: una alta, y dos anchas al lado.
// En el celular van todas en una columna. Next las reduce y optimiza al servirlas.
const PATRON = [
  "md:row-span-2",
  "md:col-span-2",
  "md:col-span-2",
];

export function Galeria({ fotos }: { fotos: Foto[] }) {
  return (
    <ul className="grid auto-rows-[16rem] gap-4 md:grid-cols-3 md:auto-rows-[17rem]">
      {fotos.map((foto, i) => (
        <li key={foto.src} className={PATRON[i % PATRON.length]}>
          <Reveal delay={(i % 3) * 0.1} className="h-full">
            <div className="group relative h-full overflow-hidden rounded-3xl border border-white/10 bg-ink-2">
              <Image
                src={foto.src}
                alt={foto.alt}
                fill
                sizes="(min-width: 768px) 66vw, 100vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          </Reveal>
        </li>
      ))}
    </ul>
  );
}
