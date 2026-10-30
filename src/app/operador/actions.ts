"use server";

import { MARCA_CAMBIO, contrasenaTemporal } from "@/lib/contrasena";
import { enviarMail, mailsActivos } from "@/lib/mail";
import { createAdminClient } from "@/lib/supabase/admin";
import { crearClienteSesion, obtenerSesion } from "@/lib/supabase/sesion";

// Solo el operador. Además de esta comprobación, la base lo exige: crear_negocio() y las
// políticas de cada tabla rechazan a cualquiera que no sea admin_plataforma.
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const HORA = /^\d{2}:\d{2}$/;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

async function esOperador(): Promise<boolean> {
  const sesion = await obtenerSesion();
  return sesion?.perfil?.rol === "admin_plataforma";
}

export type DatosNegocio = {
  slug: string;
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  anticipacionMinutos: number;
  ventanaDias: number;
  servicios: { nombre: string; descripcion: string; duracionMinutos: number; precio: number }[];
  profesionales: { nombre: string }[];
  horario: { dia: number; desde: string; hasta: string }[];
  duenoEmail: string;
  duenoNombre: string;
};

// `acceso` aparece si se dio de alta un dueño: su mail y la contraseña provisoria para pasarle
// (o `aviso`, si no se pudo crear su cuenta y hay que hacerlo aparte).
export type ResultadoAlta =
  | {
      ok: true;
      slug: string;
      acceso?: { email: string; contrasena?: string; aviso?: string };
    }
  | { ok: false; mensaje: string };

const MENSAJES: Record<string, string> = {
  SLUG_RESERVADO: "Ese slug lo usa la aplicación (panel, login, etc.). Elegí otro.",
  NOMBRE_INVALIDO: "Falta el nombre del negocio.",
  SIN_SERVICIOS: "Cargá al menos un servicio.",
  SIN_PROFESIONALES: "Cargá al menos un profesional.",
  SIN_HORARIO: "Elegí al menos un día de atención.",
  SOLO_OPERADOR: "Solo el operador puede dar de alta negocios.",
};

export async function crearNegocio(d: DatosNegocio): Promise<ResultadoAlta> {
  if (!(await esOperador())) return { ok: false, mensaje: "Tu sesión venció. Volvé a entrar." };

  const slug = d.slug.trim().toLowerCase();
  if (!SLUG.test(slug) || slug.length > 60) {
    return { ok: false, mensaje: "El slug solo puede tener letras minúsculas, números y guiones." };
  }
  if (d.nombre.trim().length < 2 || d.nombre.length > 100) {
    return { ok: false, mensaje: "Revisá el nombre del negocio." };
  }
  if (d.email.trim() && !EMAIL.test(d.email.trim())) {
    return { ok: false, mensaje: "Revisá el mail del negocio." };
  }
  if (d.duenoEmail.trim() && !EMAIL.test(d.duenoEmail.trim())) {
    return { ok: false, mensaje: "Revisá el mail del dueño." };
  }

  const servicios = d.servicios.filter((s) => s.nombre.trim() !== "");
  const profesionales = d.profesionales.filter((p) => p.nombre.trim() !== "");
  if (servicios.length === 0) return { ok: false, mensaje: MENSAJES.SIN_SERVICIOS };
  if (profesionales.length === 0) return { ok: false, mensaje: MENSAJES.SIN_PROFESIONALES };
  if (d.horario.length === 0) return { ok: false, mensaje: MENSAJES.SIN_HORARIO };

  for (const s of servicios) {
    if (!Number.isInteger(s.duracionMinutos) || s.duracionMinutos < 5 || s.duracionMinutos > 600) {
      return { ok: false, mensaje: `Revisá la duración de «${s.nombre}» (entre 5 y 600 minutos).` };
    }
    if (!Number.isFinite(s.precio) || s.precio < 0) {
      return { ok: false, mensaje: `Revisá el precio de «${s.nombre}».` };
    }
  }
  for (const h of d.horario) {
    const valido =
      Number.isInteger(h.dia) &&
      h.dia >= 0 &&
      h.dia <= 6 &&
      HORA.test(h.desde) &&
      HORA.test(h.hasta);
    if (!valido || h.hasta <= h.desde) {
      return {
        ok: false,
        mensaje: "Revisá los horarios: la hora de fin tiene que ser después de la de inicio.",
      };
    }
  }
  if (!Number.isInteger(d.ventanaDias) || d.ventanaDias < 1 || d.ventanaDias > 365) {
    return { ok: false, mensaje: "La ventana de días tiene que estar entre 1 y 365." };
  }
  if (!Number.isInteger(d.anticipacionMinutos) || d.anticipacionMinutos < 0) {
    return { ok: false, mensaje: "Revisá la anticipación mínima." };
  }

  const supabase = await crearClienteSesion();
  const { error } = await supabase.rpc("crear_negocio", {
    p_datos: {
      slug,
      nombre: d.nombre.trim(),
      email: d.email.trim(),
      telefono: d.telefono.trim(),
      direccion: d.direccion.trim(),
      anticipacion_minutos: d.anticipacionMinutos,
      ventana_dias: d.ventanaDias,
      servicios: servicios.map((s) => ({
        nombre: s.nombre.trim(),
        descripcion: s.descripcion.trim(),
        duracion_minutos: s.duracionMinutos,
        precio: s.precio,
      })),
      profesionales: profesionales.map((p) => ({ nombre: p.nombre.trim() })),
      horario: d.horario,
      dueno_email: d.duenoEmail.trim(),
      dueno_nombre: d.duenoNombre.trim(),
    },
  });

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        mensaje: "Ya existe un negocio con ese slug, o un usuario con el mail del dueño.",
      };
    }
    return {
      ok: false,
      mensaje: MENSAJES[error.message] ?? "No pudimos crear el negocio. Revisá los datos.",
    };
  }

  // El dueño entra con mail y contraseña: se le crea la cuenta con una provisoria que debe cambiar.
  const duenoEmail = d.duenoEmail.trim().toLowerCase();
  if (!duenoEmail) return { ok: true, slug };

  const contrasena = contrasenaTemporal(d.nombre);
  const { error: errorCuenta } = await createAdminClient().auth.admin.createUser({
    email: duenoEmail,
    password: contrasena,
    email_confirm: true,
    user_metadata: { [MARCA_CAMBIO]: true },
  });
  if (errorCuenta) {
    return {
      ok: true,
      slug,
      acceso: {
        email: duenoEmail,
        aviso:
          "El negocio quedó creado, pero ese mail ya tenía una cuenta o no se pudo crear. Si hace falta, dale una contraseña nueva con el script de contraseñas.",
      },
    };
  }
  return { ok: true, slug, acceso: { email: duenoEmail, contrasena } };
}

export async function cambiarActivo(id: string, activo: boolean): Promise<{ ok: boolean }> {
  if (!(await esOperador()) || !/^[0-9a-f-]{36}$/i.test(id)) return { ok: false };

  const supabase = await crearClienteSesion();
  const { data } = await supabase
    .from("negocios")
    .update({ activo })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  return { ok: Boolean(data) };
}

export type ResultadoMailPrueba = { ok: boolean; mensaje: string };

// Manda un mail de prueba a la casilla del propio operador, para comprobar que Resend quedó bien configurado.
export async function enviarMailPrueba(): Promise<ResultadoMailPrueba> {
  const sesion = await obtenerSesion();
  if (sesion?.perfil?.rol !== "admin_plataforma") {
    return { ok: false, mensaje: "Tu sesión venció. Volvé a entrar." };
  }
  if (!mailsActivos()) {
    return {
      ok: false,
      mensaje:
        "Todavía no hay una clave de Resend cargada, así que no sale ningún mail. Seguí los pasos de docs/mails-resend.md.",
    };
  }
  const enviado = await enviarMail({
    para: sesion.email,
    asunto: "Prueba de mails de Tu Turno",
    texto: "Si te llegó este mail, los mails de Tu Turno están funcionando.",
    html: '<p style="font-family:sans-serif;font-size:16px;">Si te llegó este mail, los mails de <b>Tu Turno</b> están funcionando.</p>',
  });
  return enviado
    ? { ok: true, mensaje: `Listo: mandamos un mail de prueba a ${sesion.email}. Revisá también spam.` }
    : {
        ok: false,
        mensaje:
          "Resend rechazó el envío. Revisá que la clave sea correcta y que el remitente (MAIL_FROM) sea de un dominio verificado. Sin dominio propio, solo entrega a la casilla dueña de la cuenta de Resend.",
      };
}
