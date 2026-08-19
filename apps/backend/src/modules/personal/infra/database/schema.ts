import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  smallint,
  time,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { EstadoCivil, ModalidadTrabajo, TipoContrato } from "@/modules/personal/domain/empleado";
import { OrigenFichaje, TipoFichaje } from "@/modules/personal/domain/fichaje";
import { empresas } from "@/modules/empresas/infra/database/schema";

export const estadoCivilEnum = pgEnum(
  "estado_civil",
  Object.values(EstadoCivil) as [string, ...string[]],
);
export const tipoContratoEnum = pgEnum(
  "tipo_contrato",
  Object.values(TipoContrato) as [string, ...string[]],
);
export const modalidadTrabajoEnum = pgEnum(
  "modalidad_trabajo",
  Object.values(ModalidadTrabajo) as [string, ...string[]],
);
export const tipoFichajeEnum = pgEnum("tipo_fichaje", Object.values(TipoFichaje) as [string, ...string[]]);
export const origenFichajeEnum = pgEnum(
  "origen_fichaje",
  Object.values(OrigenFichaje) as [string, ...string[]],
);

/**
 * Tabla cargos. Catálogo chico (puestos) — mismo patrón de soft-delete que
 * `frigorificos`. `tolerancia_minutos` es el 2º nivel de la cascada de
 * tolerancia (ver `Empresa.toleranciaTardanzaMinutos` para el 1º).
 */
export const cargos = pgTable("cargos", {
  id: uuid("id").primaryKey().defaultRandom(),
  empresaId: uuid("empresa_id")
    .notNull()
    .references(() => empresas.id, { onDelete: "cascade" }),
  nombre: varchar("nombre", { length: 100 }).notNull(),
  toleranciaMinutos: integer("tolerancia_minutos"),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

/**
 * Tabla empleados. Legajo básico — mismo patrón de soft-delete que
 * `proveedores`/`frigorificos`. `cargo_id` en `onDelete: "restrict"`: no
 * tiene sentido borrar un cargo si todavía hay empleados asignados (hay que
 * reasignarlos primero, o inactivar el cargo en vez de borrarlo).
 *
 * `dni_archivo_path`: ruta relativa dentro de `FileStorage`, NUNCA una URL
 * pública — se sirve por un endpoint autenticado (ver `EmpleadoController`).
 */
export const empleados = pgTable("empleados", {
  id: uuid("id").primaryKey().defaultRandom(),
  empresaId: uuid("empresa_id")
    .notNull()
    .references(() => empresas.id, { onDelete: "cascade" }),

  // Datos personales e identificatorios
  nombre: varchar("nombre", { length: 100 }).notNull(),
  apellido: varchar("apellido", { length: 100 }).notNull(),
  dni: varchar("dni", { length: 20 }).notNull(),
  dniArchivoPath: varchar("dni_archivo_path", { length: 500 }),
  cuil: varchar("cuil", { length: 20 }),
  domicilio: varchar("domicilio", { length: 255 }),
  telefono: varchar("telefono", { length: 50 }),
  fechaNacimiento: date("fecha_nacimiento", { mode: "date" }),
  estadoCivil: estadoCivilEnum("estado_civil"),
  contactoEmergenciaNombre: varchar("contacto_emergencia_nombre", { length: 150 }),
  contactoEmergenciaTelefono: varchar("contacto_emergencia_telefono", { length: 50 }),

  // Datos laborales y contractuales
  fechaIngreso: date("fecha_ingreso", { mode: "date" }).notNull(),
  cargoId: uuid("cargo_id").references(() => cargos.id, { onDelete: "restrict" }),
  categoriaProfesional: varchar("categoria_profesional", { length: 150 }),
  convenioColectivo: varchar("convenio_colectivo", { length: 100 }),
  tipoContrato: tipoContratoEnum("tipo_contrato"),
  modalidad: modalidadTrabajoEnum("modalidad"),
  lugarPrestacionTareas: varchar("lugar_prestacion_tareas", { length: 255 }),
  datosBancarios: varchar("datos_bancarios", { length: 100 }),

  // Operativo (módulo de asistencia)
  nombreDispositivo: varchar("nombre_dispositivo", { length: 100 }),
  toleranciaMinutos: integer("tolerancia_minutos"),

  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

/**
 * Horario pactado por día de semana. `unique(empleadoId, diaSemana)`: un
 * empleado tiene a lo sumo una fila por día — `setHorarios()` hace
 * delete-and-reinsert completo, así que en la práctica nunca choca, pero la
 * constraint documenta la invariante igual.
 */
export const horariosEmpleado = pgTable(
  "horarios_empleado",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    empleadoId: uuid("empleado_id")
      .notNull()
      .references(() => empleados.id, { onDelete: "cascade" }),
    diaSemana: smallint("dia_semana").notNull(),
    horaEntrada: time("hora_entrada"),
    horaSalida: time("hora_salida"),
  },
  (table) => [unique("horarios_empleado_empleado_dia_unique").on(table.empleadoId, table.diaSemana)],
);

/**
 * Marcaciones crudas — append-only, nunca se actualizan (ver `Fichaje` en el
 * dominio). El índice compuesto acelera tanto el dedupe al importar
 * (`FichajeRepository.listByEmpleadosEnRango`) como, más adelante, el cálculo
 * de jornada por empleado y día.
 */
export const fichajes = pgTable(
  "fichajes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    empresaId: uuid("empresa_id")
      .notNull()
      .references(() => empresas.id, { onDelete: "cascade" }),
    empleadoId: uuid("empleado_id")
      .notNull()
      .references(() => empleados.id, { onDelete: "cascade" }),
    momento: timestamp("momento").notNull(),
    tipo: tipoFichajeEnum("tipo").notNull(),
    origen: origenFichajeEnum("origen").notNull().default(OrigenFichaje.IMPORTADO),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("fichajes_empleado_momento_idx").on(table.empleadoId, table.momento)],
);
