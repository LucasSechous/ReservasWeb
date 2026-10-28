import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Entrar",
  robots: { index: false, follow: false },
};

export default function Login({ searchParams }: PageProps<"/login">) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-12">
      <Link href="/" className="font-display text-xl font-extrabold tracking-tight">
        reservas<span className="text-accent">web</span>
      </Link>
      <h1 className="mt-8 font-display text-3xl font-extrabold">Entrar a tu panel</h1>
      <p className="mt-2 text-white/65">
        Te mandamos un link por mail. Sin contraseñas.
      </p>
      <div className="mt-8">
        <Suspense fallback={<p className="text-white/50">Cargando…</p>}>
          <Formulario searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function Formulario({
  searchParams,
}: {
  searchParams: Promise<{ [clave: string]: string | string[] | undefined }>;
}) {
  const { error } = await searchParams;
  return <LoginForm errorInicial={Boolean(error)} />;
}
