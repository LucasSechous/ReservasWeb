import type { Metadata } from "next";
import Link from "next/link";
import { EMAIL } from "@/lib/contacto";

export const metadata: Metadata = { title: "Política de privacidad" };

// Borrador basado en la Ley 18.331 de Protección de Datos Personales de Uruguay.
// Conviene que lo revise una persona con conocimiento legal antes del primer cliente.
export default function Privacidad() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-12 leading-relaxed">
      <Link href="/" className="text-sm font-semibold text-white/60 hover:text-white">
        ← Volver
      </Link>
      <h1 className="mt-6 font-display text-4xl font-extrabold">Política de privacidad</h1>
      <p className="mt-2 text-sm text-white/50">Última actualización: 30 de octubre de 2026</p>

      <section className="mt-8 space-y-6 text-white/80">
        <div>
          <h2 className="text-xl font-bold text-white">Qué datos se piden</h2>
          <p className="mt-2">
            Al reservar un turno se piden tu nombre, tu teléfono y, de forma opcional, tu mail.
            También se guarda el servicio elegido, el día y la hora del turno y, si el negocio lo
            marca, si asististe o no.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Para qué se usan</h2>
          <p className="mt-2">
            Solo para gestionar tu reserva: confirmarla, avisarte por mail si dejaste uno (incluido
            un recordatorio el día anterior al turno), y permitirte cancelarla. El negocio donde
            reservás ve estos datos para atenderte y lleva un historial de tus turnos y de tu
            asistencia, que usa para organizar su agenda; por ejemplo, puede recibir un aviso si
            reservás de nuevo después de haber faltado varias veces sin cancelar. Ese historial es
            propio de cada negocio: no se comparte con otros. No se usan tus datos para publicidad
            ni se venden o ceden a terceros.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Servicios de salud</h2>
          <p className="mt-2">
            Si reservás en una clínica, un consultorio u otro servicio de salud, los datos de la
            reserva sirven únicamente para coordinar el turno. No escribas información clínica
            (síntomas, diagnósticos, tratamientos) en los campos de la reserva: eso se conversa
            directamente con el profesional, que es quien responde por el tratamiento de los datos
            de salud, considerados sensibles por la ley.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Quién es responsable</h2>
          <p className="mt-2">
            El negocio donde reservás es responsable del tratamiento de tus datos. Tu Turno
            provee la plataforma que los guarda y los procesa por cuenta del negocio, con medidas de
            seguridad para evitar el acceso no autorizado.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Cuánto tiempo se guardan</h2>
          <p className="mt-2">
            Se conservan mientras sean necesarios para el servicio y para llevar el historial de
            turnos del negocio. Podés pedir que se eliminen en cualquier momento.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Tus derechos</h2>
          <p className="mt-2">
            Según la Ley 18.331 podés acceder a tus datos, rectificarlos, actualizarlos o pedir que
            se supriman. Para ejercer estos derechos escribí al negocio o a{" "}
            <a href={`mailto:${EMAIL}`} className="font-semibold underline">
              {EMAIL}
            </a>
            . También podés presentar un reclamo ante la Unidad Reguladora y de Control de Datos
            Personales (URCDP).
          </p>
        </div>
      </section>
    </main>
  );
}
