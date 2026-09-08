import path from "node:path";

import { defineConfig } from "vitest/config";

/**
 * Config mínima: solo necesitamos que vitest resuelva el alias "@/*" del
 * mismo modo que tsconfig.json (`baseUrl: "./"`, `paths: {"@/*": ["src/*"]}`)
 * — sin esto, cualquier test que importe algo de dominio con "@/..." falla
 * en tiempo de resolución de módulos, no de tipos.
 */
export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
