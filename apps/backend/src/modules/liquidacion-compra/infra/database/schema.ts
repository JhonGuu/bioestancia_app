import { boolean, numeric, pgTable, timestamp, unique, uuid, varchar } from "drizzle-orm/pg-core";

import { empresas } from "@/modules/empresas/infra/database/schema";
import { compras } from "@/modules/compras/infra/database/schema";

/**
 * Liquidación de compra (ver `domain/liquidacion-compra.ts`). 1 a 1 con
 * `compras` — `unique` en `compraId` lo garantiza a nivel de base.
 */
export const liquidacionCompra = pgTable(
  "liquidacion_compra",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    empresaId: uuid("empresa_id")
      .notNull()
      .references(() => empresas.id, { onDelete: "cascade" }),
    compraId: uuid("compra_id")
      .notNull()
      .references(() => compras.id, { onDelete: "cascade" }),
    numeroComprobante: varchar("numero_comprobante", { length: 30 }).notNull(),
    fecha: timestamp("fecha").notNull(),
    fechaOperacion: timestamp("fecha_operacion"),
    cae: varchar("cae", { length: 20 }),
    fechaVencimientoCae: timestamp("fecha_vencimiento_cae"),
    importeBruto: numeric("importe_bruto", { precision: 14, scale: 2 }).notNull(),
    ivaSobreBruto: numeric("iva_sobre_bruto", { precision: 14, scale: 2 }).notNull(),
    totalGastos: numeric("total_gastos", { precision: 14, scale: 2 }),
    ivaSobreGastos: numeric("iva_sobre_gastos", { precision: 14, scale: 2 }),
    totalTributos: numeric("total_tributos", { precision: 14, scale: 2 }),
    importeNeto: numeric("importe_neto", { precision: 14, scale: 2 }).notNull(),
    comentarios: varchar("comentarios", { length: 255 }),
    activo: boolean("activo").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [unique("liquidacion_compra_compra_unique").on(table.compraId)],
);
