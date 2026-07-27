import {
  boolean,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { empresas } from "@/modules/empresas/infra/database/schema";

/**
 * Tabla listas_de_precios. Encabezado nada más (ver nota en domain/lista-de-precios.ts
 * sobre por qué los ítems/precios van a ir en otra tabla el día que exista un
 * módulo de catálogo/productos).
 */
export const listasDePrecios = pgTable("listas_de_precios", {
  id: uuid("id").primaryKey().defaultRandom(),
  empresaId: uuid("empresa_id")
    .notNull()
    .references(() => empresas.id, { onDelete: "cascade" }),
  nombre: varchar("nombre", { length: 100 }).notNull(),
  descripcion: varchar("descripcion", { length: 255 }),
  activa: boolean("activa").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});
