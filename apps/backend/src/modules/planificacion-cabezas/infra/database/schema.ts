import { boolean, integer, pgTable, timestamp, unique, uuid, varchar } from "drizzle-orm/pg-core";

import { empresas } from "@/modules/empresas/infra/database/schema";
import { clientes } from "@/modules/clientes/infra/database/schema";

/**
 * Planificación de cabezas por cliente y día (ver `domain/planificacion-cabezas.ts`).
 *
 * `fecha` se normaliza a medianoche en el use-case antes de guardar (el "día"
 * es la unidad, no un instante) — así el `unique(clienteId, fecha)` funciona
 * como se espera: un plan por cliente por día.
 */
export const planificacionCabezas = pgTable(
  "planificacion_cabezas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    empresaId: uuid("empresa_id")
      .notNull()
      .references(() => empresas.id, { onDelete: "cascade" }),
    clienteId: uuid("cliente_id")
      .notNull()
      .references(() => clientes.id, { onDelete: "restrict" }),
    fecha: timestamp("fecha").notNull(),
    cabezasPlanificadas: integer("cabezas_planificadas").notNull(),
    comentarios: varchar("comentarios", { length: 255 }),
    activo: boolean("activo").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [unique("planificacion_cabezas_cliente_fecha_unique").on(table.clienteId, table.fecha)],
);
