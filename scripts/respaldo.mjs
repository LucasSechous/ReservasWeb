// Respaldo de las tablas de la base: baja todo a archivos JSON en respaldos/AAAA-MM-DD/.
// Es un parche hasta que Supabase pase al plan pago (que trae respaldos diarios automáticos).
// Conviene correrlo una vez por semana y copiar la carpeta a un lugar fuera de esta máquina.
//
// Uso: node scripts/respaldo.mjs
// Lee NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY de .env.local. La clave no sale de tu máquina.
// Los datos de los clientes quedan en esos archivos: la carpeta respaldos/ está ignorada por git.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// Cada tabla con las columnas por las que se ordena al paginar (así no se repiten ni se saltean filas).
const TABLAS = {
  negocios: ["id"],
  usuarios: ["id"],
  profesionales: ["id"],
  servicios: ["id"],
  profesional_servicios: ["profesional_id", "servicio_id"],
  horarios_disponibles: ["id"],
  horarios_excepciones: ["id"],
  reservas: ["id"],
};
const PAGINA = 1000;

function leerEnv() {
  const env = {};
  for (const linea of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

const env = leerEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL ?? env.NEXT_SUPABASE_URL;
const clave = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !clave) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const admin = createClient(url, clave, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const carpeta = `respaldos/${new Date().toISOString().slice(0, 10)}`;
mkdirSync(carpeta, { recursive: true });

let fallo = false;
for (const [tabla, orden] of Object.entries(TABLAS)) {
  const filas = [];
  for (let desde = 0; ; desde += PAGINA) {
    let consulta = admin.from(tabla).select("*");
    for (const columna of orden) consulta = consulta.order(columna, { ascending: true });
    const { data, error } = await consulta.range(desde, desde + PAGINA - 1);
    if (error) {
      console.error(`✗ ${tabla}: ${error.message}`);
      fallo = true;
      break;
    }
    filas.push(...data);
    if (data.length < PAGINA) break;
  }
  if (!fallo) {
    writeFileSync(`${carpeta}/${tabla}.json`, JSON.stringify(filas, null, 2));
    console.log(`✓ ${tabla}: ${filas.length} filas`);
  }
  fallo = false;
}
console.log(`\nListo: ${carpeta}/`);
