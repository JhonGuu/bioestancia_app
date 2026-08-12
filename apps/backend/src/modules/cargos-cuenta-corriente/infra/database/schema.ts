import { boolean, numeric, pgEnum, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { TipoCargo } from "@/modules/cargos-cuenta-corriente/domain/tipo-cargo";
import { empresas } from "@/modules/empresas/infra/database/schema";
import { clientes } from "@/modules/clientes/infra/database/schema";
import { cheques } from "@/modules/cheques/infra/database/schema";

export const tipoCargoEnum = pgEnum("tipo_cargo", Object.values(TipoCargo) as [string, ...string[]]);

/**
 * Tabla cargos_cuenta_corriente — ver `domain/cargo-cuenta-corriente.ts`.
 * `activo`+`deletedAt`: mismo patrón que el resto de las cabeceras, para una
 * futura "anular cargo" (no implementada todavía).
 */
export const cargosCuentaCorriente = pgTable("cargos_cuenta_corriente", {
  id: uuid("id").primaryKey().defaultRandom(),
  empresaId: uuid("empresa_id")
    .notNull()
    .references(() => empresas.id, { onDelete: "cascade" }),
  clienteId: uuid("cliente_id")
    .notNull()
    .references(() => clientes.id, { onDelete: "restrict" }),
  tipo: tipoCargoEnum("tipo").notNull(),
  monto: numeric("monto", { precision: 14, scale: 2 }).notNull(),
  chequeId: uuid("cheque_id").references(() => cheques.id, { onDelete: "restrict" }),
  motivo: varchar("motivo", { length: 255 }),
  fecha: timestamp("fecha").notNull(),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});
