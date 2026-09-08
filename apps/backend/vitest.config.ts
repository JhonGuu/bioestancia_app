import path from "node:path";

import { configDefaults, defineConfig } from "vitest/config";

/**
 * Config mínima: solo necesitamos que vitest resuelva el alias "@/*" del
 * mismo modo que tsconfig.json (`baseUrl: "./"`, `paths: {"@/*": ["src/*"]}`)
 * — sin esto, cualquier test que importe algo de dominio con "@/..." falla
 * en tiempo de resolución de módulos, no de tipos.
 *
 * Los tests de integración (`*.integration.test.ts`, contra Postgres real)
 * quedan afuera de `pnpm test` a propósito — ver `vitest.integration.config.ts`
 * (`pnpm test:integration`). Sin esto, `pnpm test` fallaría para cualquiera
 * que no tenga esa base levantada, rompiendo la promesa de que el test suite
 * "normal" es rápido y no toca la base.
 */
export default defineConfig({
  test: {
    environment: "node",
    exclude: [...configDefaults.exclude, "**/*.integration.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
