import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Entrar",
  robots: { index: false, follow: false },
};

export default function Login() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-12">
      <Link href="/" className="font-display text-xl font-extrabold tracking-tight">
        tu<span className="text-accent">turno</span>
      </Link>
      <h1 className="mt-8 font-display text-3xl font-extrabold">Entrar a tu panel</h1>
      <p className="mt-2 text-white/65">Con tu mail y tu contraseña.</p>
      <div className="mt-8">
        <LoginForm />
      </div>
    </main>
  );
}
