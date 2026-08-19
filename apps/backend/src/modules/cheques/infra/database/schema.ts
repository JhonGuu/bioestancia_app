import { numeric, pgEnum, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { EstadoCheque } from "@/modules/cheques/domain/estado-cheque";
import { empresas } from "@/modules/empresas/infra/database/schema";
import { clientes } from "@/modules/clientes/infra/database/schema";

export const estadoChequeEnum = pgEnum(
  "estado_cheque",
  Object.values(EstadoCheque) as [string, ...string[]],
);

/**
 * Tabla cheques — ver `domain/cheque.ts`. No tiene `activo`/`deletedAt`: a
 * diferencia de clientes/proveedores, un cheque no se "da de baja", su
 * estado de negocio ya lo cubre `estado` (rechazado, endosado, etc.).
 *
 * `monto`/`cuitLibrador`/`titular` son `numeric`/nullable siguiendo el mismo
 * criterio que el resto de las tablas de plata (`ventas`, `compra_categorias`).
 */
export const cheques = pgTable("cheques", {
  id: uuid("id").primaryKey().defaultRandom(),
  empresaId: uuid("empresa_id")
    .notNull()
    .references(() => empresas.id, { onDelete: "cascade" }),
  clienteId: uuid("cliente_id")
    .notNull()
    .references(() => clientes.id, { onDelete: "restrict" }),
  numero: varchar("numero", { length: 50 }).notNull(),
  banco: varchar("banco", { length: 100 }).notNull(),
  cuitLibrador: varchar("cuit_librador", { length: 20 }),
  titular: varchar("titular", { length: 150 }),
  fechaEmision: timestamp("fecha_emision").notNull(),
  fechaPago: timestamp("fecha_pago").notNull(),
  monto: numeric("monto", { precision: 14, scale: 2 }).notNull(),
  estado: estadoChequeEnum("estado").notNull().default(EstadoCheque.EN_CARTERA),
  fechaUltimoCambioEstado: timestamp("fecha_ultimo_cambio_estado").notNull().defaultNow(),
  motivoRechazo: varchar("motivo_rechazo", { length: 255 }),
  endosadoA: varchar("endosado_a", { length: 150 }),
  fechaEndoso: timestamp("fecha_endoso"),
  comentarios: varchar("comentarios", { length: 255 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
