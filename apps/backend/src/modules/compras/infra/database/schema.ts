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

import { EspecieAnimal } from "@/modules/compras/domain/especie-animal";
import { empresas } from "@/modules/empresas/infra/database/schema";
import { proveedores } from "@/modules/proveedores/infra/database/schema";
import { gruposTropas } from "@/modules/grupos-tropas/infra/database/schema";

export const especieAnimalEnum = pgEnum(
  "especie_animal",
  Object.values(EspecieAnimal) as [string, ...string[]],
);

/**
 * Tabla compras (antes "tropas" — se renombró para poder sumar compras de
 * otras especies a futuro sin reestructurar nada; `numero` sigue siendo el
 * número de tropa/lote, que es como lo maneja el negocio).
 *
 * `numero` es el código de lote que ya usan en la planilla (ej. "193-BIO") —
 * lo guardamos tal cual lo asignan, sin forzar un formato ni unicidad global:
 * no tenemos certeza de que nunca se repita entre años, y bloquear la carga
 * por eso sería peor que el problema que resuelve.
 *
 * `especie`: hoy siempre `porcino`, pero deja la puerta abierta a bovino u
 * otra especie sin cambiar la tabla.
 *
 * `letra`: código que se le muestra al cliente en la boleta en vez del
 * `numero` real — rota con el tiempo, es solo un campo de texto libre.
 *
 * `proveedorId` es el "lugar de carga" de la planilla original (de dónde sale
 * el animal): referencia a `proveedores`, `onDelete: "restrict"` porque no
 * tiene sentido borrar un proveedor si todavía hay compras cargadas a su nombre.
 *
 * `dte`/`remito`: los dos documentos de referencia de la compra (uno de cada
 * por compra). Se guardan como texto, no se valida formato — son números que
 * emiten terceros (SENASA / el proveedor).
 *
 * NO tiene `cantidadAnimales`: el remito/DTE real ya viene separado por
 * categoría/raza (ej. "30 machos + 90 hembras"), así que ese total vive en
 * `compra_categorias` (una fila por categoría) y es la suma de sus líneas.
 * `peso_bruto`/`peso_neto` en cambio SÍ son un escalar acá: en la báscula se
 * pesa la tropa entera de una vez — el desglose por categoría recién se
 * hace más adelante, al armar la liquidación de compra.
 *
 * `cerrada`/`fechaCierre`/`pesoFinalVenta`/`rinde`: se completan recién al
 * cerrar la compra (`use-cases/cerrar-compra.use-case.ts`), por eso son
 * nullable salvo `cerrada` (arranca en `false`).
 *
 * `grupoTropasId`: FK nullable a `grupos_tropas` — ver `modules/grupos-tropas/domain/grupo-tropas.ts`.
 * Una compra pertenece a lo sumo un grupo a la vez; mientras el grupo esté
 * abierto, esta compra NO se puede cerrar individualmente (se cierra
 * cerrando el grupo completo). `onDelete: "set null"` porque borrar el
 * grupo (no hay caso de uso hoy, pero por las dudas) no debería arrastrarse
 * a borrar la compra.
 *
 * `alertaSuperavit`: se completa al cerrar (tropa suelta o, para las
 * agrupadas, heredada del cierre del grupo) si las cabezas vendidas
 * superaron a las compradas — no bloquea el cierre, queda como aviso visible.
 */
export const compras = pgTable("compras", {
  id: uuid("id").primaryKey().defaultRandom(),
  empresaId: uuid("empresa_id")
    .notNull()
    .references(() => empresas.id, { onDelete: "cascade" }),
  proveedorId: uuid("proveedor_id")
    .notNull()
    .references(() => proveedores.id, { onDelete: "restrict" }),
  numero: varchar("numero", { length: 50 }).notNull(),
  especie: especieAnimalEnum("especie").notNull().default(EspecieAnimal.PORCINO),
  letra: varchar("letra", { length: 5 }),
  fecha: timestamp("fecha").notNull(),
  dte: varchar("dte", { length: 50 }).notNull(),
  remito: varchar("remito", { length: 50 }).notNull(),
  // $/kg en pie negociado con el proveedor para esta tropa — ver domain/compra.ts.
  precioCompraKg: numeric("precio_compra_kg", { precision: 12, scale: 2 }),
  porcentajeDesbaste: numeric("porcentaje_desbaste", { precision: 5, scale: 2 }).notNull(),
  pesoBruto: numeric("peso_bruto", { precision: 10, scale: 2 }).notNull(),
  pesoNeto: numeric("peso_neto", { precision: 10, scale: 2 }).notNull(),
  cerrada: boolean("cerrada").notNull().default(false),
  fechaCierre: timestamp("fecha_cierre"),
  pesoFinalVenta: numeric("peso_final_venta", { precision: 10, scale: 2 }),
  rinde: numeric("rinde", { precision: 5, scale: 2 }),
  grupoTropasId: uuid("grupo_tropas_id").references(() => gruposTropas.id, { onDelete: "set null" }),
  alertaSuperavit: boolean("alerta_superavit").notNull().default(false),
  comentarios: varchar("comentarios", { length: 255 }),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

/**
 * Líneas de categoría/raza de una compra (ver `domain/compra-categoria.ts`
 * para la explicación completa de las 3 fases: compra, faena, liquidación).
 *
 * `onDelete: "cascade"` en `compraId` porque estas líneas son parte de la
 * compra, no una referencia cruzada — si se borra la compra, se borran con ella.
 */
export const compraCategorias = pgTable("compra_categorias", {
  id: uuid("id").primaryKey().defaultRandom(),
  compraId: uuid("compra_id")
    .notNull()
    .references(() => compras.id, { onDelete: "cascade" }),
  categoria: varchar("categoria", { length: 100 }).notNull(),
  raza: varchar("raza", { length: 100 }),
  cabezas: integer("cabezas").notNull(),
  // Nullable: se discrimina recién al armar la liquidación de compra (ver
  // `domain/compra-categoria.ts`) — ya no se carga al crear la compra.
  pesoBruto: numeric("peso_bruto", { precision: 10, scale: 2 }),
  pesoNeto: numeric("peso_neto", { precision: 10, scale: 2 }),
  // Fase 2: resultado de faena.
  kgVivoFaena: numeric("kg_vivo_faena", { precision: 10, scale: 2 }),
  kgCarne: numeric("kg_carne", { precision: 10, scale: 2 }),
  porcentajeMagro: numeric("porcentaje_magro", { precision: 5, scale: 2 }),
  destinoComercial: varchar("destino_comercial", { length: 10 }),
  cuartosDelantero: integer("cuartos_delantero"),
  cuartosTrasero: integer("cuartos_trasero"),
  comisosCabezas: integer("comisos_cabezas"),
  comisosKg: numeric("comisos_kg", { precision: 10, scale: 2 }),
  // Fase 3: liquidación de compra.
  precioKg: numeric("precio_kg", { precision: 12, scale: 2 }),
  importeBruto: numeric("importe_bruto", { precision: 14, scale: 2 }),
  porcentajeIva: numeric("porcentaje_iva", { precision: 5, scale: 2 }),
  importeIva: numeric("importe_iva", { precision: 14, scale: 2 }),
  // Fase 4: liquidación de faena (lo que cobra el FRIGORÍFICO por faenar).
  canonFaenaPorAnimal: numeric("canon_faena_por_animal", { precision: 12, scale: 2 }),
  canonFaenaSubtotal: numeric("canon_faena_subtotal", { precision: 14, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
