import { whatsappUrl } from "@/lib/contacto";

// Cartel fijo para las páginas de demostración: deja claro que no es un negocio real.
export function BannerDemo() {
  return (
    <div className="sticky top-0 z-50 bg-amber-300 px-4 py-2 text-center text-sm font-semibold text-black">
      Esto es una demo de ReservasWeb: las reservas son de prueba.{" "}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2"
      >
        Quiero una web así
      </a>
    </div>
  );
}
