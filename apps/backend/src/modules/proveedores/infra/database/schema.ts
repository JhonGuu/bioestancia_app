import {
  boolean,
  numeric,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { empresas } from "@/modules/empresas/infra/database/schema";
import { condicionFiscalEnum } from "@/modules/clientes/infra/database/schema";

/**
 * Tabla proveedores. Mismo patrón que `clientes`, reusando el enum Postgres
 * `condicion_fiscal` ya creado por el módulo `clientes` (no se duplica el tipo).
 *
 * `datos_bancarios`: CBU o CVU (22 dígitos), nullable — no todo proveedor
 * tiene datos bancarios cargados de entrada.
 *
 * `porcentaje_desbaste`: % negociado con este criadero, usado como default al
 * cargar una tropa de compra (ver `modules/tropas`). `numeric`, no `real`,
 * mismo criterio que los pesos/precios de `ventas`.
 */
export const proveedores = pgTable("proveedores", {
  id: uuid("id").primaryKey().defaultRandom(),
  empresaId: uuid("empresa_id")
    .notNull()
    .references(() => empresas.id, { onDelete: "cascade" }),
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
  datosBancarios: varchar("datos_bancarios", { length: 22 }),
  porcentajeDesbaste: numeric("porcentaje_desbaste", { precision: 5, scale: 2 }),
  // RENSPA (SENASA): "NN.NNN.N.NNNNN/NN" (18 caracteres) — 20 deja margen.
  renspa: varchar("renspa", { length: 20 }),
  /**
   * Código + descripción del WSLSP (AFIP) juntos en un solo texto — ver
   * `domain/codigo-afip-porcino.ts`. `varchar` y no un `pgEnum`: algunas
   * descripciones (ej. código 103) superan los 63 bytes que Postgres permite
   * por etiqueta de enum. La validez del valor se garantiza en la capa de
   * aplicación (Zod, `z.nativeEnum(CodigoAfipPorcino)`), no en el tipo de columna.
   */
  codigoAfip: varchar("codigo_afip", { length: 255 }),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});
