import Link from "next/link";
import { Logo } from "@/components/logo";

// Links viejos o mal copiados (un negocio que ya no está, un link de turno vencido).
export default function NoEncontrado() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-12">
      <Link href="/" aria-label="Tu Turno, ir al inicio">
        <Logo />
      </Link>
      <h1 className="mt-8 font-display text-3xl font-extrabold">No encontramos esta página</h1>
      <p className="mt-3 text-white/65">
        Puede que el link esté incompleto o que ya no exista. Si te lo pasó un negocio, pediles que
        te lo manden de nuevo.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex min-h-12 w-fit items-center rounded-full bg-accent px-6 font-bold text-accent-ink transition hover:brightness-110"
      >
        Ir al inicio
      </Link>
    </main>
  );
}
