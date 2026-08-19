import { boolean, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { empresas } from "@/modules/empresas/infra/database/schema";

/**
 * Tabla frigorificos. Catálogo de establecimientos faenadores — mismo patrón
 * de soft-delete que `proveedores` (ver ese schema para el criterio).
 *
 * `senasa_numero`/`ruca_numero`: identifican al establecimiento en los
 * documentos SENASA (Resultado de Faena) — texto libre porque el formato
 * varía entre "17.014.0.02035/00" y códigos numéricos simples según cómo
 * cada planta lo tenga registrado.
 */
export const frigorificos = pgTable("frigorificos", {
  id: uuid("id").primaryKey().defaultRandom(),
  empresaId: uuid("empresa_id")
    .notNull()
    .references(() => empresas.id, { onDelete: "cascade" }),
  nombre: varchar("nombre", { length: 255 }).notNull(),
  cuit: varchar("cuit", { length: 20 }),
  senasaNumero: varchar("senasa_numero", { length: 30 }),
  rucaNumero: varchar("ruca_numero", { length: 30 }),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});
