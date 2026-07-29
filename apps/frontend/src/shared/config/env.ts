import { z } from "zod";

/**
 * Variables de entorno del frontend, validadas con Zod al arrancar la app.
 * Vite solo expone las que empiezan con `VITE_` (ver .env.example).
 */
const envSchema = z.object({
  VITE_API_URL: z.string().url().default("http://localhost:3000/api"),
});

function loadEnv() {
  const parsed = envSchema.safeParse(import.meta.env);
  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error("Variables de entorno inválidas:", parsed.error.flatten().fieldErrors);
    throw new Error("Configuración de entorno inválida. Revisá tu archivo .env");
  }
  return parsed.data;
}

const validated = loadEnv();

export const Env = {
  apiUrl: validated.VITE_API_URL,
} as const;
