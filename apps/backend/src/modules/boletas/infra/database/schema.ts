import { boolean, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { empresas } from "@/modules/empresas/infra/database/schema";
import { clientes } from "@/modules/clientes/infra/database/schema";

/**
 * Tabla boletas: el comprobante por cliente/día. Las líneas de venta de esa
 * boleta viven en `ventas` (`ventas.boleta_id`, ver `modules/ventas`).
 *
 * `numero`: el número impreso en el papel — texto libre, sin unicidad
 * forzada (no tenemos certeza de que la numeración en papel nunca se repita).
 */
export const boletas = pgTable("boletas", {
  id: uuid("id").primaryKey().defaultRandom(),
  empresaId: uuid("empresa_id")
    .notNull()
    .references(() => empresas.id, { onDelete: "cascade" }),
  clienteId: uuid("cliente_id")
    .notNull()
    .references(() => clientes.id, { onDelete: "restrict" }),
  fecha: timestamp("fecha").notNull(),
  /** Nullable solo por boletas cargadas antes de este campo — ver `domain/boleta.ts`. */
  fechaVencimiento: timestamp("fecha_vencimiento"),
  numero: varchar("numero", { length: 50 }),
  comentarios: varchar("comentarios", { length: 255 }),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});
