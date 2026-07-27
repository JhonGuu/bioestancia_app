import { boolean, integer, numeric, pgTable, timestamp, unique, uuid, varchar } from "drizzle-orm/pg-core";

import { empresas } from "@/modules/empresas/infra/database/schema";
import { compras } from "@/modules/compras/infra/database/schema";

/**
 * Resultado de faena (ver `domain/resultado-faena.ts`). 1 a 1 con `compras`
 * — `unique` en `compraId` lo garantiza a nivel de base.
 *
 * `onDelete: "cascade"` en `compraId`: es un documento que pertenece a esa
 * compra puntual, no una referencia compartida.
 */
export const resultadoFaena = pgTable(
  "resultado_faena",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    empresaId: uuid("empresa_id")
      .notNull()
      .references(() => empresas.id, { onDelete: "cascade" }),
    compraId: uuid("compra_id")
      .notNull()
      .references(() => compras.id, { onDelete: "cascade" }),
    fechaFaena: timestamp("fecha_faena").notNull(),
    numero: varchar("numero", { length: 50 }),
    numeroAutorizacion: varchar("numero_autorizacion", { length: 50 }),
    kgVivoTotal: numeric("kg_vivo_total", { precision: 10, scale: 2 }).notNull(),
    kgCarneTotal: numeric("kg_carne_total", { precision: 10, scale: 2 }).notNull(),
    comisosKg: numeric("comisos_kg", { precision: 10, scale: 2 }).notNull().default("0"),
    comisosCabezas: integer("comisos_cabezas").notNull().default(0),
    rendimiento: numeric("rendimiento", { precision: 5, scale: 2 }).notNull(),
    comentarios: varchar("comentarios", { length: 255 }),
    activo: boolean("activo").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [unique("resultado_faena_compra_unique").on(table.compraId)],
);
