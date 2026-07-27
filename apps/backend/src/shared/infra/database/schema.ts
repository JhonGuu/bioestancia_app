/**
 * Registro central de schemas de base de datos.
 *
 * Cada módulo tiene su propio schema en `src/modules/<modulo>/infra/database/schema.ts`.
 * Acá los re-exportamos todos para que Drizzle pueda inicializar el cliente con el
 * schema completo (necesario para `db.query.<tabla>.findFirst()` y relaciones).
 *
 * Cuando agregues un módulo nuevo, sumá su export acá.
 */
export * from "@/modules/empresas/infra/database/schema";
export * from "@/modules/users/infra/database/schema";
export * from "@/modules/listas-precios/infra/database/schema";
export * from "@/modules/clientes/infra/database/schema";
export * from "@/modules/proveedores/infra/database/schema";
export * from "@/modules/boletas/infra/database/schema";
export * from "@/modules/compras/infra/database/schema";
export * from "@/modules/ventas/infra/database/schema";
export * from "@/modules/resultado-faena/infra/database/schema";
export * from "@/modules/liquidacion-compra/infra/database/schema";
export * from "@/modules/planificacion-cabezas/infra/database/schema";
