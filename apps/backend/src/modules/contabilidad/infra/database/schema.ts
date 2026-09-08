import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { EstadoAsiento, RespaldoAsiento, TipoAsiento } from "@/modules/contabilidad/domain/asiento";
import { EstadoEjercicio, EstadoPeriodo } from "@/modules/contabilidad/domain/ejercicio";
import { EventoAsiento } from "@/modules/contabilidad/domain/regla-asiento";
import { TipoAuxiliar } from "@/modules/contabilidad/domain/tipo-auxiliar";
import { TipoCuenta } from "@/modules/contabilidad/domain/tipo-cuenta";
import { empresas } from "@/modules/empresas/infra/database/schema";

export const tipoCuentaEnum = pgEnum("tipo_cuenta", Object.values(TipoCuenta) as [string, ...string[]]);
export const tipoAuxiliarEnum = pgEnum("tipo_auxiliar", Object.values(TipoAuxiliar) as [string, ...string[]]);
export const estadoEjercicioEnum = pgEnum("estado_ejercicio", Object.values(EstadoEjercicio) as [string, ...string[]]);
export const estadoPeriodoEnum = pgEnum("estado_periodo", Object.values(EstadoPeriodo) as [string, ...string[]]);
export const tipoAsientoEnum = pgEnum("tipo_asiento", Object.values(TipoAsiento) as [string, ...string[]]);
export const estadoAsientoEnum = pgEnum("estado_asiento", Object.values(EstadoAsiento) as [string, ...string[]]);
export const respaldoAsientoEnum = pgEnum("respaldo_asiento", Object.values(RespaldoAsiento) as [string, ...string[]]);
export const eventoAsientoEnum = pgEnum("evento_asiento", Object.values(EventoAsiento) as [string, ...string[]]);
export const ladoLineaReglaEnum = pgEnum("lado_linea_regla", ["debe", "haber"]);

/**
 * Plan de cuentas, por empresa. La jerarquía es explícita (`parentId`), no
 * derivada del código: así se puede recodificar una cuenta sin que se mueva
 * de lugar en el árbol.
 *
 * Sin `deletedAt`: una cuenta con movimientos no se borra nunca (rompería
 * el mayor), se desactiva (`activa = false`). El borrado real solo se
 * permite si no tiene hijos ni movimientos, y ahí es un DELETE de verdad
 * — ver `EliminarCuenta`.
 */
export const planCuentas = pgTable(
  "plan_cuentas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    empresaId: uuid("empresa_id")
      .notNull()
      .references(() => empresas.id, { onDelete: "cascade" }),
    codigo: varchar("codigo", { length: 20 }).notNull(),
    nombre: varchar("nombre", { length: 150 }).notNull(),
    tipo: tipoCuentaEnum("tipo").notNull(),
    /** Autorreferencia — `AnyPgColumn` no hace falta: Drizzle la resuelve con el callback. */
    parentId: uuid("parent_id"),
    imputable: boolean("imputable").notNull().default(true),
    /** Ver `Cuenta.monetaria` — define qué se ajusta por inflación (RT 6). */
    monetaria: boolean("monetaria").notNull().default(false),
    requiereAuxiliar: tipoAuxiliarEnum("requiere_auxiliar").notNull().default(TipoAuxiliar.NINGUNO),
    activa: boolean("activa").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    unique("plan_cuentas_empresa_codigo_unique").on(table.empresaId, table.codigo),
    index("plan_cuentas_empresa_idx").on(table.empresaId),
    index("plan_cuentas_parent_idx").on(table.parentId),
  ],
);

/**
 * Centros de costo — dimensión opcional para imputar un movimiento a una
 * parte del negocio (una tropa, una unidad) sin duplicar cuentas.
 *
 * Todavía NO tiene pantalla: la tabla y la columna existen desde ahora
 * porque agregarlas después obligaría a re-imputar a mano los asientos
 * viejos para que los informes históricos sirvan.
 */
export const centrosCosto = pgTable(
  "centros_costo",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    empresaId: uuid("empresa_id")
      .notNull()
      .references(() => empresas.id, { onDelete: "cascade" }),
    codigo: varchar("codigo", { length: 20 }).notNull(),
    nombre: varchar("nombre", { length: 150 }).notNull(),
    activo: boolean("activo").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [unique("centros_costo_empresa_codigo_unique").on(table.empresaId, table.codigo)],
);

/**
 * Ejercicio contable. Por empresa: El Meridiano cierra en diciembre y
 * Bioestancia en mayo, cada una lleva su propia numeración.
 */
export const ejerciciosContables = pgTable(
  "ejercicios_contables",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    empresaId: uuid("empresa_id")
      .notNull()
      .references(() => empresas.id, { onDelete: "cascade" }),
    numero: integer("numero").notNull(),
    nombre: varchar("nombre", { length: 100 }).notNull(),
    fechaInicio: timestamp("fecha_inicio").notNull(),
    fechaFin: timestamp("fecha_fin").notNull(),
    estado: estadoEjercicioEnum("estado").notNull().default(EstadoEjercicio.ABIERTO),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [unique("ejercicios_empresa_numero_unique").on(table.empresaId, table.numero)],
);

/** Período mensual. Cerrarlo congela sus asientos. */
export const periodosContables = pgTable(
  "periodos_contables",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ejercicioId: uuid("ejercicio_id")
      .notNull()
      .references(() => ejerciciosContables.id, { onDelete: "cascade" }),
    anio: integer("anio").notNull(),
    mes: integer("mes").notNull(),
    estado: estadoPeriodoEnum("estado").notNull().default(EstadoPeriodo.ABIERTO),
    cerradoAt: timestamp("cerrado_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [unique("periodos_ejercicio_anio_mes_unique").on(table.ejercicioId, table.anio, table.mes)],
);

/**
 * Cabecera del asiento. `numero` es nullable a propósito: los borradores no
 * consumen numeración, se les asigna el correlativo recién al confirmarlos.
 * El `unique(ejercicio, numero)` no molesta a los borradores porque en
 * Postgres los NULL no colisionan entre sí.
 */
export const asientos = pgTable(
  "asientos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    empresaId: uuid("empresa_id")
      .notNull()
      .references(() => empresas.id, { onDelete: "cascade" }),
    ejercicioId: uuid("ejercicio_id")
      .notNull()
      .references(() => ejerciciosContables.id, { onDelete: "restrict" }),
    periodoId: uuid("periodo_id")
      .notNull()
      .references(() => periodosContables.id, { onDelete: "restrict" }),
    numero: integer("numero"),
    fecha: timestamp("fecha").notNull(),
    tipo: tipoAsientoEnum("tipo").notNull().default(TipoAsiento.MANUAL),
    estado: estadoAsientoEnum("estado").notNull().default(EstadoAsiento.BORRADOR),
    /** Ver `RespaldoAsiento` — permite separar la vista real de la respaldada. */
    respaldo: respaldoAsientoEnum("respaldo").notNull().default(RespaldoAsiento.SIN_COMPROBANTE),
    descripcion: varchar("descripcion", { length: 255 }).notNull(),
    /** Documento que lo generó (fase 2: motor de asientos automáticos). */
    origenTipo: varchar("origen_tipo", { length: 50 }),
    origenId: uuid("origen_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    unique("asientos_ejercicio_numero_unique").on(table.ejercicioId, table.numero),
    index("asientos_empresa_fecha_idx").on(table.empresaId, table.fecha),
    index("asientos_periodo_idx").on(table.periodoId),
    index("asientos_origen_idx").on(table.origenTipo, table.origenId),
  ],
);

/**
 * Líneas del asiento. Nacen y mueren con su cabecera (`cascade`), igual que
 * `lineas_cobro` con `cobros`: editar un asiento reemplaza sus líneas.
 *
 * `debe`/`haber`: una línea usa uno u otro, nunca los dos (lo valida el
 * dominio). `numeric(16,2)` — dos dígitos más de margen que el resto de las
 * tablas de plata porque acá se acumulan totales de todo un ejercicio.
 */
export const asientoLineas = pgTable(
  "asiento_lineas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    asientoId: uuid("asiento_id")
      .notNull()
      .references(() => asientos.id, { onDelete: "cascade" }),
    orden: integer("orden").notNull().default(0),
    cuentaId: uuid("cuenta_id")
      .notNull()
      .references(() => planCuentas.id, { onDelete: "restrict" }),
    debe: numeric("debe", { precision: 16, scale: 2 }).notNull().default("0"),
    haber: numeric("haber", { precision: 16, scale: 2 }).notNull().default("0"),
    detalle: varchar("detalle", { length: 255 }),
    /** Submayor: a qué cliente/proveedor/empleado corresponde esta línea. */
    auxiliarTipo: varchar("auxiliar_tipo", { length: 30 }),
    auxiliarId: uuid("auxiliar_id"),
    /** Anticuación de la partida para el ajuste por inflación (fase 5). */
    fechaOrigen: timestamp("fecha_origen").notNull(),
    centroCostoId: uuid("centro_costo_id").references(() => centrosCosto.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("asiento_lineas_asiento_idx").on(table.asientoId),
    index("asiento_lineas_cuenta_idx").on(table.cuentaId),
    index("asiento_lineas_auxiliar_idx").on(table.auxiliarTipo, table.auxiliarId),
  ],
);


/**
 * Reglas del motor de asientos automáticos (fase 2): "cuando pasa el
 * evento X (y, si `condicion` no es null, la unidad matchea), generá estas
 * líneas" — ver `domain/regla-asiento.ts` y
 * `use-cases/generar-asientos-automaticos.use-case.ts`.
 *
 * Varias reglas pueden compartir `evento` con `condicion` distinta (ej. una
 * por medio de pago de un cobro): para una unidad dada se usa la primera
 * activa que matchea, en orden de `prioridad` ascendente.
 */
export const reglasAsiento = pgTable(
  "reglas_asiento",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    empresaId: uuid("empresa_id")
      .notNull()
      .references(() => empresas.id, { onDelete: "cascade" }),
    evento: eventoAsientoEnum("evento").notNull(),
    nombre: varchar("nombre", { length: 150 }).notNull(),
    activa: boolean("activa").notNull().default(true),
    prioridad: integer("prioridad").notNull().default(0),
    /** Ej. `{"medioPago": "efectivo"}` — todas las claves tienen que matchear contra la unidad. `null` = siempre aplica. */
    condicion: jsonb("condicion").$type<Record<string, string> | null>(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("reglas_asiento_empresa_evento_idx").on(table.empresaId, table.evento)],
);

/**
 * Líneas de la "plantilla" de una regla — no un movimiento concreto: el
 * monto y el auxiliar recién se resuelven al evaluarla contra una unidad
 * puntual (`expresion` nombra un campo numérico de `UnidadEventoContable`,
 * `auxiliarResolver` de dónde sale el `auxiliarId`).
 */
export const reglasAsientoLineas = pgTable(
  "reglas_asiento_lineas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reglaId: uuid("regla_id")
      .notNull()
      .references(() => reglasAsiento.id, { onDelete: "cascade" }),
    orden: integer("orden").notNull().default(0),
    lado: ladoLineaReglaEnum("lado").notNull(),
    cuentaId: uuid("cuenta_id")
      .notNull()
      .references(() => planCuentas.id, { onDelete: "restrict" }),
    expresion: varchar("expresion", { length: 30 }).notNull(),
    auxiliarResolver: varchar("auxiliar_resolver", { length: 20 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("reglas_asiento_lineas_regla_idx").on(table.reglaId)],
);
