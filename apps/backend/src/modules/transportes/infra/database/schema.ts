import {
  boolean,
  date,
  pgEnum,
  pgTable,
  primaryKey,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { clientes } from "@/modules/clientes/infra/database/schema";
import { empresas } from "@/modules/empresas/infra/database/schema";
import { TipoVehiculo } from "@/modules/transportes/domain/vehiculo";

export const tipoVehiculoEnum = pgEnum(
  "tipo_vehiculo",
  Object.values(TipoVehiculo) as [string, ...string[]],
);

/**
 * Directorio de transporte, por empresa (Bioestancia y El Meridiano no
 * comparten nada). CUIT y patente son únicos POR EMPRESA, incluyendo los dados
 * de baja: reactivar uno nunca choca con un duplicado.
 */
export const transportistas = pgTable(
  "transportistas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    empresaId: uuid("empresa_id")
      .notNull()
      .references(() => empresas.id, { onDelete: "cascade" }),
    nombre: varchar("nombre", { length: 255 }).notNull(),
    cuit: varchar("cuit", { length: 11 }).notNull(),
    telefono: varchar("telefono", { length: 30 }),
    esPropio: boolean("es_propio").notNull().default(false),
    activo: boolean("activo").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [unique("transportistas_empresa_cuit_unique").on(table.empresaId, table.cuit)],
);

export const choferes = pgTable(
  "choferes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    empresaId: uuid("empresa_id")
      .notNull()
      .references(() => empresas.id, { onDelete: "cascade" }),
    transportistaId: uuid("transportista_id").references(() => transportistas.id, {
      onDelete: "set null",
    }),
    nombre: varchar("nombre", { length: 100 }).notNull(),
    apellido: varchar("apellido", { length: 100 }).notNull(),
    cuit: varchar("cuit", { length: 11 }).notNull(),
    dni: varchar("dni", { length: 20 }),
    telefono: varchar("telefono", { length: 30 }),
    licenciaVencimiento: date("licencia_vencimiento", { mode: "string" }),
    activo: boolean("activo").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [unique("choferes_empresa_cuit_unique").on(table.empresaId, table.cuit)],
);

export const vehiculos = pgTable(
  "vehiculos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    empresaId: uuid("empresa_id")
      .notNull()
      .references(() => empresas.id, { onDelete: "cascade" }),
    transportistaId: uuid("transportista_id").references(() => transportistas.id, {
      onDelete: "set null",
    }),
    tipo: tipoVehiculoEnum("tipo").notNull(),
    patente: varchar("patente", { length: 10 }).notNull(),
    descripcion: varchar("descripcion", { length: 255 }),
    rtoVencimiento: date("rto_vencimiento", { mode: "string" }),
    seguroVencimiento: date("seguro_vencimiento", { mode: "string" }),
    habilitacionAnimalesVencimiento: date("habilitacion_animales_vencimiento", { mode: "string" }),
    activo: boolean("activo").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [unique("vehiculos_empresa_patente_unique").on(table.empresaId, table.patente)],
);

/** Choferes autorizados a retirar mercadería de un cliente. Se borra sola si desaparece el cliente o el chofer. */
export const clienteChoferes = pgTable(
  "cliente_choferes",
  {
    clienteId: uuid("cliente_id")
      .notNull()
      .references(() => clientes.id, { onDelete: "cascade" }),
    choferId: uuid("chofer_id")
      .notNull()
      .references(() => choferes.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.clienteId, table.choferId] })],
);

/** Vehículos autorizados a retirar mercadería de un cliente. */
export const clienteVehiculos = pgTable(
  "cliente_vehiculos",
  {
    clienteId: uuid("cliente_id")
      .notNull()
      .references(() => clientes.id, { onDelete: "cascade" }),
    vehiculoId: uuid("vehiculo_id")
      .notNull()
      .references(() => vehiculos.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.clienteId, table.vehiculoId] })],
);
