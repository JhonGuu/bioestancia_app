/**
 * Registro central de schemas de base de datos.
 *
 * Cada módulo tiene su propio schema en `src/modules/<modulo>/infra/database/schema.ts`.
 * Acá los re-exportamos todos para que Drizzle pueda inicializar el cliente con el
 * schema completo (necesario para `db.query.<tabla>.findFirst()` y relaciones).
 *
 * Cuando agregues un módulo nuevo, sumá su export acá.
 */
export * from "@/modules/users/infra/database/schema";
