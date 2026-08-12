import { boolean, numeric, pgEnum, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { MedioPago } from "@/modules/cobros/domain/medio-pago";
import { empresas } from "@/modules/empresas/infra/database/schema";
import { clientes } from "@/modules/clientes/infra/database/schema";
import { boletas } from "@/modules/boletas/infra/database/schema";
import { cheques } from "@/modules/cheques/infra/database/schema";

export const medioPagoEnum = pgEnum("medio_pago", Object.values(MedioPago) as [string, ...string[]]);

/**
 * Tabla cobros — cabecera. Ver `domain/cobro.ts`. `activo`+`deletedAt`:
 * mismo patrón que clientes/proveedores/boletas, para una futura "anular
 * cobro" (no implementada todavía).
 */
export const cobros = pgTable("cobros", {
  id: uuid("id").primaryKey().defaultRandom(),
  empresaId: uuid("empresa_id")
    .notNull()
    .references(() => empresas.id, { onDelete: "cascade" }),
  clienteId: uuid("cliente_id")
    .notNull()
    .references(() => clientes.id, { onDelete: "restrict" }),
  fecha: timestamp("fecha").notNull(),
  comentarios: varchar("comentarios", { length: 255 }),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

/**
 * Tabla lineas_cobro — detalle de un cobro (uno o más medios de pago).
 * Sin `activo`/`deletedAt`: nace y muere con su `cobro` (mismo criterio que
 * `compra_categorias`). `chequeId` solo se completa en líneas CHEQUE/ECHEQ.
 */
export const lineasCobro = pgTable("lineas_cobro", {
  id: uuid("id").primaryKey().defaultRandom(),
  cobroId: uuid("cobro_id")
    .notNull()
    .references(() => cobros.id, { onDelete: "cascade" }),
  medioPago: medioPagoEnum("medio_pago").notNull(),
  monto: numeric("monto", { precision: 14, scale: 2 }).notNull(),
  chequeId: uuid("cheque_id").references(() => cheques.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * Tabla aplicaciones_cobro — resultado del algoritmo FIFO
 * (`AplicarCobroFifo`), qué parte de qué cobro se aplicó a qué boleta. Sin
 * `activo`/`deletedAt`: son filas de cálculo, no algo que se edite a mano.
 */
export const aplicacionesCobro = pgTable("aplicaciones_cobro", {
  id: uuid("id").primaryKey().defaultRandom(),
  cobroId: uuid("cobro_id")
    .notNull()
    .references(() => cobros.id, { onDelete: "cascade" }),
  boletaId: uuid("boleta_id")
    .notNull()
    .references(() => boletas.id, { onDelete: "restrict" }),
  monto: numeric("monto", { precision: 14, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
