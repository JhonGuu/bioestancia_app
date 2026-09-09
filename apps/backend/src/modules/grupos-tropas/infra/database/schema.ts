import { boolean, numeric, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { empresas } from "@/modules/empresas/infra/database/schema";

/**
 * Tabla grupos_tropas — ver `domain/grupo-tropas.ts` para la explicación
 * completa del problema de negocio que resuelve.
 *
 * `compras.grupo_tropas_id` (agregada en `modules/compras/infra/database/schema.ts`)
 * es la FK inversa: una compra pertenece a lo sumo un grupo a la vez. Esta
 * tabla no referencia `compras` directamente — la relación se consulta desde
 * el lado de `compras` (`CompraRepository.listByGrupo`).
 */
export const gruposTropas = pgTable("grupos_tropas", {
  id: uuid("id").primaryKey().defaultRandom(),
  empresaId: uuid("empresa_id")
    .notNull()
    .references(() => empresas.id, { onDelete: "cascade" }),
  nombre: varchar("nombre", { length: 100 }),
  pesoBrutoTotal: numeric("peso_bruto_total", { precision: 12, scale: 2 }).notNull(),
  pesoNetoTotal: numeric("peso_neto_total", { precision: 12, scale: 2 }).notNull(),
  cerrado: boolean("cerrado").notNull().default(false),
  fechaCierre: timestamp("fecha_cierre"),
  pesoFinalVentaTotal: numeric("peso_final_venta_total", { precision: 12, scale: 2 }),
  rinde: numeric("rinde", { precision: 5, scale: 2 }),
  alertaSuperavit: boolean("alerta_superavit").notNull().default(false),
  comentarios: varchar("comentarios", { length: 255 }),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});
