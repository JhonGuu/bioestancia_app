import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  // Glob: drizzle-kit busca todos los archivos llamados schema.ts en cualquier
  // subcarpeta. Eso le permite encontrar los schemas de cada módulo automáticamente.
  schema: "./src/**/schema.ts",

  // Carpeta donde drizzle-kit genera las migraciones SQL.
  out: "./src/shared/infra/database/migrations",

  dialect: "postgresql",

  dbCredentials: {
    url: process.env.DB_URL ?? "",
  },

  // Tabla y schema donde drizzle-kit registra qué migraciones ya aplicó.
  migrations: {
    table: "migrations",
    schema: "public",
  },

  // Imprime más info en consola cuando generás/aplicás migraciones.
  verbose: true,
  strict: true,
});
