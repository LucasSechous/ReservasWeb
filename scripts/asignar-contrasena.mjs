// Da una contraseña provisoria a una cuenta (la crea si no existe). Sirve para el operador y para
// resetear la de un dueño que se la olvidó. La persona tiene que cambiarla al entrar.
//
// Uso: node scripts/asignar-contrasena.mjs <mail> [nombre-del-negocio]
// Lee NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY de .env.local. La clave no sale de tu máquina.
import { randomInt } from "node:crypto";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function leerEnv() {
  const env = {};
  for (const linea of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

const [email, nombre = "panel"] = process.argv.slice(2);
if (!email || !email.includes("@")) {
  console.error("Uso: node scripts/asignar-contrasena.mjs <mail> [nombre-del-negocio]");
  process.exit(1);
}

const env = leerEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL ?? env.NEXT_SUPABASE_URL;
const clave = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !clave) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const base =
  nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 14) || "panel";
const contrasena = `${base}${randomInt(1000, 10000)}`;
const mail = email.trim().toLowerCase();

const admin = createClient(url, clave, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let existente = null;
for (let pagina = 1; !existente; pagina++) {
  const { data, error } = await admin.auth.admin.listUsers({ page: pagina, perPage: 200 });
  if (error) throw error;
  existente = data.users.find((u) => u.email?.toLowerCase() === mail) ?? null;
  if (data.users.length < 200) break;
}

const meta = { ...(existente?.user_metadata ?? {}), debe_cambiar_password: true };
const { error } = existente
  ? await admin.auth.admin.updateUserById(existente.id, {
      password: contrasena,
      user_metadata: meta,
    })
  : await admin.auth.admin.createUser({
      email: mail,
      password: contrasena,
      email_confirm: true,
      user_metadata: meta,
    });
if (error) throw error;

console.log(`${existente ? "Contraseña actualizada" : "Cuenta creada"} para ${mail}`);
console.log(`Contraseña provisoria: ${contrasena}`);
console.log("Al entrar, el panel le pide elegir una propia.");
