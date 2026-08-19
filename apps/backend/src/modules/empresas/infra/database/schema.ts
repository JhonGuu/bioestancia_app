import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { Rubro } from "@/modules/empresas/domain/empresa";

/**
 * Enum de Postgres para el rubro. Derivado del enum TS para que estén sincronizados
 * (mismo patrón que `user_role` en modules/users).
 */
export const rubroEnum = pgEnum("empresa_rubro", Object.values(Rubro) as [string, ...string[]]);

/**
 * Tabla empresas. Es la tabla maestra del multi-empresa: todo módulo de negocio
 * (ventas, gastos, stock, faena, etc.) referencia esta tabla vía `empresaId`.
 */
export const empresas = pgTable("empresas", {
  id: uuid("id").primaryKey().defaultRandom(),
  razonSocial: varchar("razon_social", { length: 255 }).notNull(),
  cuit: varchar("cuit", { length: 20 }),
  telefono: varchar("telefono", { length: 50 }),
  direccion: varchar("direccion", { length: 255 }),
  /** Ver `Empresa.toleranciaTardanzaMinutos` en el dominio. */
  toleranciaTardanzaMinutos: integer("tolerancia_tardanza_minutos"),
  rubro: rubroEnum("rubro").notNull(),
  activa: boolean("activa").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});
