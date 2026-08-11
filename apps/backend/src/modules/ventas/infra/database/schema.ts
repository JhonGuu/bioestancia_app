import {
  boolean,
  integer,
  numeric,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { FormaVenta } from "@/modules/ventas/domain/forma-venta";
import { empresas } from "@/modules/empresas/infra/database/schema";
import { clientes, clientesFinales } from "@/modules/clientes/infra/database/schema";
import { compras } from "@/modules/compras/infra/database/schema";
import { boletas } from "@/modules/boletas/infra/database/schema";

export const formaVentaEnum = pgEnum(
  "forma_venta",
  Object.values(FormaVenta) as [string, ...string[]],
);

/**
 * Tabla ventas. Cada fila es UNA venta de un garrón (cabeza entera, media res,
 * o un corte como pulpa) o un ajuste de compensación.
 *
 * `compraId`/`garron` nullable: una compensación de kg no tiene animal físico.
 *
 * OJO: NO hay `unique(compraId, garron)` — cada garrón tiene 2 medias reses, y
 * se pueden vender por separado a dos clientes distintos (dos filas con el
 * mismo compraId+garron, `formaVenta = media_res_capon`). La reconciliación de
 * "cuántas cabezas se vendieron" para el cierre de una compra se hace contando
 * GARRONES DISTINTOS (`count(distinct garron)`), no filas — ver
 * `modules/compras/use-cases/cerrar-compra.use-case.ts`.
 *
 * `boletaId` referencia el comprobante del cliente para ese día
 * (`modules/boletas`) — nullable por compatibilidad con datos previos al
 * módulo de boletas.
 *
 * `kg`/`precioKg`/`total` son `numeric` (no `real`) para no acumular error de
 * punto flotante en un total de plata. Drizzle mapea `numeric` a `string` en
 * JS (no soporta `mode: "number"` en esta versión) — la conversión a `number`
 * del dominio se hace en el repositorio (`infra/repository/venta.repository.ts`),
 * no acá.
 */
export const ventas = pgTable("ventas", {
  id: uuid("id").primaryKey().defaultRandom(),
  empresaId: uuid("empresa_id")
    .notNull()
    .references(() => empresas.id, { onDelete: "cascade" }),
  clienteId: uuid("cliente_id")
    .notNull()
    .references(() => clientes.id, { onDelete: "restrict" }),
  boletaId: uuid("boleta_id").references(() => boletas.id, { onDelete: "set null" }),
  compraId: uuid("compra_id").references(() => compras.id, { onDelete: "restrict" }),
  garron: integer("garron"),
  formaVenta: formaVentaEnum("forma_venta").notNull(),
  /** Categoría del animal (Capón, Chancha, MEI, etc.) — texto libre, mismo criterio que `compra_categorias.categoria` (ver ese schema). Null en `compensacion_kg`. */
  categoria: varchar("categoria", { length: 100 }),
  kg: numeric("kg", { precision: 10, scale: 2 }).notNull(),
  /** Nullable: el operario carga la venta sin precio, se completa después (`set-precio-venta.use-case.ts`). */
  precioKg: numeric("precio_kg", { precision: 12, scale: 2 }),
  /** Nullable, ídem `precioKg` — se calcula en el server recién cuando se carga el precio. */
  total: numeric("total", { precision: 14, scale: 2 }),
  fecha: timestamp("fecha").notNull(),
  /** Ver comentario en `domain/venta.ts` — destino del catálogo `clientes_finales`, solo para revendedores. */
  clienteFinalId: uuid("cliente_final_id").references(() => clientesFinales.id, { onDelete: "set null" }),
  comentarios: varchar("comentarios", { length: 255 }),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});
