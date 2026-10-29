import Link from "next/link";

// Botón de llamado a la acción de una landing: reserva dentro del sitio, o enlace externo (WhatsApp).
export type Cta = { href: string; texto: string; externo: boolean };

export function BotonCta({
  cta,
  className,
  children,
}: {
  cta: Cta;
  className: string;
  children?: React.ReactNode;
}) {
  return cta.externo ? (
    <a href={cta.href} target="_blank" rel="noopener noreferrer" className={className}>
      {children ?? cta.texto}
    </a>
  ) : (
    <Link href={cta.href} className={className}>
      {children ?? cta.texto}
    </Link>
  );
}
