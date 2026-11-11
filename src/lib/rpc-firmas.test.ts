import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Cada llamada .rpc("funcion", {...}) del código tiene que coincidir con la firma de la función en
// supabase/migrations/. Si falta un parámetro sin valor por defecto, Supabase no encuentra la función
// (PGRST202) y la llamada falla en producción, no en el build: así se rompió la reserva pública
// (reservar() pasó a pedir p_notas el 29/10 y el formulario no lo mandaba).

type Parametro = { nombre: string; opcional: boolean };

const RAIZ = process.cwd();

/** Texto entre el paréntesis (o llave) que abre en `desde` y el que lo cierra. */
function bloque(texto: string, desde: number): string {
  const abre = texto[desde];
  const cierra = abre === "(" ? ")" : "}";
  let nivel = 0;
  for (let i = desde; i < texto.length; i++) {
    if (texto[i] === abre) nivel++;
    else if (texto[i] === cierra && --nivel === 0) return texto.slice(desde + 1, i);
  }
  throw new Error(`Sin cierre para ${abre} en la posición ${desde}`);
}

/** Separa por comas que no estén dentro de paréntesis, llaves ni corchetes. */
function partir(texto: string): string[] {
  const partes: string[] = [];
  let nivel = 0;
  let actual = "";
  for (const c of texto) {
    if ("([{".includes(c)) nivel++;
    if (")]}".includes(c)) nivel--;
    if (c === "," && nivel === 0) {
      partes.push(actual);
      actual = "";
    } else actual += c;
  }
  if (actual.trim()) partes.push(actual);
  return partes;
}

/** Firma vigente de cada función pública: la última definición en las migraciones, en orden. */
function firmas(): Map<string, Parametro[]> {
  const carpeta = join(RAIZ, "supabase", "migrations");
  const resultado = new Map<string, Parametro[]>();
  for (const archivo of readdirSync(carpeta).filter((a) => a.endsWith(".sql")).sort()) {
    const sql = readFileSync(join(carpeta, archivo), "utf8").replace(/--[^\n]*/g, "");
    for (const m of sql.matchAll(/create\s+(?:or\s+replace\s+)?function\s+public\.(\w+)\s*\(/gi)) {
      const parametros = partir(bloque(sql, m.index + m[0].length - 1))
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p) => ({
          nombre: p.split(/\s+/)[0],
          opcional: /\bdefault\b|=/i.test(p),
        }));
      resultado.set(m[1], parametros);
    }
  }
  return resultado;
}

function archivos(carpeta: string): string[] {
  return readdirSync(carpeta).flatMap((nombre) => {
    const ruta = join(carpeta, nombre);
    if (statSync(ruta).isDirectory()) return archivos(ruta);
    return /\.tsx?$/.test(nombre) && !nombre.includes(".test.") ? [ruta] : [];
  });
}

type Llamada = { donde: string; funcion: string; argumentos: Map<string, string> };

function llamadas(): Llamada[] {
  const resultado: Llamada[] = [];
  for (const ruta of archivos(join(RAIZ, "src"))) {
    const codigo = readFileSync(ruta, "utf8");
    for (const m of codigo.matchAll(/\.rpc\(\s*"(\w+)"\s*(,\s*\{)?/g)) {
      const argumentos = new Map<string, string>();
      if (m[2]) {
        // Sin comentarios: pueden tener comas y paréntesis que confunden al separar.
        const objeto = bloque(codigo, m.index + m[0].length - 1).replace(/\/\/[^\n]*/g, "");
        for (const parte of partir(objeto)) {
          const par = parte.match(/^\s*(\w+)\s*:\s*([\s\S]*)$/);
          if (par) argumentos.set(par[1], par[2].trim());
        }
      }
      const linea = codigo.slice(0, m.index).split("\n").length;
      resultado.push({ donde: `${ruta.slice(RAIZ.length + 1)}:${linea}`, funcion: m[1], argumentos });
    }
  }
  return resultado;
}

describe("llamadas a funciones de la base", () => {
  const conocidas = firmas();
  const todas = llamadas();

  it("encuentra las llamadas y las firmas", () => {
    expect(todas.length).toBeGreaterThan(5);
    expect(conocidas.get("reservar")?.length).toBe(9);
  });

  it.each(todas.map((l) => [`${l.funcion} en ${l.donde}`, l] as const))("%s", (_, llamada) => {
    const firma = conocidas.get(llamada.funcion);
    expect(firma, `${llamada.funcion}() no está en supabase/migrations/`).toBeDefined();
    const nombres = new Set(firma!.map((p) => p.nombre));

    for (const nombre of llamada.argumentos.keys()) {
      expect(nombres.has(nombre), `${nombre} no es un parámetro de ${llamada.funcion}()`).toBe(true);
    }
    for (const p of firma!.filter((p) => !p.opcional)) {
      const valor = llamada.argumentos.get(p.nombre);
      expect(valor, `falta ${p.nombre}, que no tiene valor por defecto`).toBeDefined();
      // undefined hace que el parámetro no viaje: para "sin valor" hay que mandar null.
      expect(valor, `${p.nombre} puede ir como undefined; mandá null`).not.toMatch(/\bundefined\b/);
    }
  });
});
