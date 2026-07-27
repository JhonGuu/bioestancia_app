import {
  boolean,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { CondicionFiscal } from "@/modules/clientes/domain/condicion-fiscal";
import { empresas } from "@/modules/empresas/infra/database/schema";
import { listasDePrecios } from "@/modules/listas-precios/infra/database/schema";

export const condicionFiscalEnum = pgEnum(
  "condicion_fiscal",
  Object.values(CondicionFiscal) as [string, ...string[]],
);

/**
 * Tabla clientes.
 *
 * `listaDePreciosId` referencia `listas_de_precios` con `onDelete: "set null"`:
 * si se borra la lista de precios, el cliente no se borra ni se rompe, solo
 * queda sin lista asignada (a diferencia de `empresaId`, que sí es `cascade`
 * porque un cliente no puede existir sin empresa).
 *
 * `nombre`/`apellido`/`razonSocial`/`cuit`/`dni` son todos nullable a
 * propósito: un cliente es persona física (nombre+apellido+dni) O persona
 * jurídica (razonSocial+cuit), nunca las dos cosas obligatorias a la vez.
 * Esa regla se valida con Zod en infra/http/validation.ts, no acá.
 */
export const clientes = pgTable("clientes", {
  id: uuid("id").primaryKey().defaultRandom(),
  empresaId: uuid("empresa_id")
    .notNull()
    .references(() => empresas.id, { onDelete: "cascade" }),
  listaDePreciosId: uuid("lista_de_precios_id").references(() => listasDePrecios.id, {
    onDelete: "set null",
  }),
  nombre: varchar("nombre", { length: 100 }),
  apellido: varchar("apellido", { length: 100 }),
  razonSocial: varchar("razon_social", { length: 255 }),
  cuit: varchar("cuit", { length: 20 }),
  dni: varchar("dni", { length: 20 }),
  email: varchar("email", { length: 255 }),
  domicilio: varchar("domicilio", { length: 255 }),
  pais: varchar("pais", { length: 100 }),
  provincia: varchar("provincia", { length: 100 }),
  ubicacion: varchar("ubicacion", { length: 255 }),
  condicionFiscal: condicionFiscalEnum("condicion_fiscal").notNull(),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});
