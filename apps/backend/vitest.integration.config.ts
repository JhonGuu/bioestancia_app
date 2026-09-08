import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * Config separada para los tests de integración (`*.integration.test.ts`),
 * que corren contra una base Postgres real (ver `vitest.integration.setup.ts`)
 * y la truncan entera con `DrizzleAdapter.clear()` antes de sembrar sus
 * propios datos — por eso viven aparte de `pnpm test` (`vitest.config.ts`):
 * nunca deberían correr sin querer contra una base que a alguien le importe.
 *
 * `pnpm test:integration` los corre a propósito. Requiere `DB_URL` apuntando
 * a una base de desarrollo/test descartable (nunca producción).
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.integration.test.ts"],
    setupFiles: ["./vitest.integration.setup.ts"],
    testTimeout: 20_000,
    // Un solo hilo: todos los tests de integración comparten la misma base
    // (y `clear()` la trunca entera), correr en paralelo se pisaría solo.
    fileParallelism: false,
  },
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
