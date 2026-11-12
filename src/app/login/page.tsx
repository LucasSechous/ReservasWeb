import type { Metadata } from "next";
import { MarcoAcceso } from "@/components/marco-acceso";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Entrar",
  robots: { index: false, follow: false },
};

export default function Login() {
  return (
    <MarcoAcceso titulo="Entrar a tu panel" bajada="Con el mail y la contraseña de tu negocio.">
      <LoginForm />
    </MarcoAcceso>
  );
}
