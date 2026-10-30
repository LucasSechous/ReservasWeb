import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const aqui = (ruta: string) => fileURLToPath(new URL(ruta, import.meta.url));

// Pruebas de la lógica pura (fechas, clientes, vocabulario, mails…). Las reglas de la base se prueban
// aparte, con los scripts de supabase/tests/.
export default defineConfig({
  resolve: {
    alias: {
      "@": aqui("./src"),
      // "server-only" corta la importación fuera del servidor de Next; en las pruebas no hace falta.
      "server-only": aqui("./vitest.vacio.ts"),
    },
  },
  test: { include: ["src/**/*.test.ts"] },
});
