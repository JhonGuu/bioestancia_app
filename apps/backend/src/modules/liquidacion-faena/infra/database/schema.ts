import { boolean, numeric, pgTable, timestamp, unique, uuid, varchar } from "drizzle-orm/pg-core";

import { empresas } from "@/modules/empresas/infra/database/schema";
import { compras } from "@/modules/compras/infra/database/schema";
import { frigorificos } from "@/modules/frigorificos/infra/database/schema";

/**
 * Liquidación de faena (ver `domain/liquidacion-faena.ts`). 1 a 1 con
 * `compras` — `unique` en `compraId` lo garantiza a nivel de base.
 *
 * `onDelete: "cascade"` en `compraId`: es un documento que pertenece a esa
 * compra puntual, no una referencia compartida.
 */
export const liquidacionFaena = pgTable(
  "liquidacion_faena",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    empresaId: uuid("empresa_id")
      .notNull()
      .references(() => empresas.id, { onDelete: "cascade" }),
    compraId: uuid("compra_id")
      .notNull()
      .references(() => compras.id, { onDelete: "cascade" }),
    // Nullable: mismo criterio que `resultadoFaena.frigorificoId`.
    frigorificoId: uuid("frigorifico_id").references(() => frigorificos.id, { onDelete: "set null" }),
    fecha: timestamp("fecha").notNull(),
    comentarios: varchar("comentarios", { length: 255 }),
    total: numeric("total", { precision: 14, scale: 2 }).notNull(),
    activo: boolean("activo").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [unique("liquidacion_faena_compra_unique").on(table.compraId)],
);
