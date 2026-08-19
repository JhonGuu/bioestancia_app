import {
  boolean,
  pgEnum,
  pgTable,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { Roles } from "@/modules/users/domain/roles";
import { empresas } from "@/modules/empresas/infra/database/schema";

/**
 * Enum de Postgres para el rol. Lo derivamos del enum TS para que estén siempre
 * sincronizados. Vive acá (no en la tabla `users`) porque el rol es una propiedad
 * de `usuario_empresas`, no del usuario.
 */
export const rolesEnum = pgEnum("user_role", Object.values(Roles) as [string, ...string[]]);

/**
 * Tabla users. Convenciones:
 *   - PK: uuid generado por Postgres con `defaultRandom()`.
 *   - Soft delete: `deletedAt` nullable. Si no es null, el user está "borrado".
 *   - Auditoría: `createdAt` y `updatedAt`.
 *   - Email y username son únicos.
 *
 * Notá que NO tiene columna `role`: el rol es relativo a una empresa y vive en
 * `usuario_empresas` de abajo.
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  phoneNumber: varchar("phone_number", { length: 20 }),
  isActive: boolean("is_active").notNull().default(true),
  /**
   * Fuerza el cambio de contraseña en el próximo login. Se activa cuando un
   * admin crea el usuario con una contraseña temporal generada por el sistema
   * (ver `POST /account/users` y `ChangePassword`). Se apaga solo cuando el
   * usuario la cambia.
   */
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

/**
 * Tabla puente usuario_empresas: qué usuarios pueden operar qué empresas, y con
 * qué rol en cada una. Un usuario puede tener 0, 1 o varias filas acá.
 *
 * `unique(usuarioId, empresaId)`: un usuario no puede tener dos roles distintos
 * en la misma empresa al mismo tiempo — si cambia de rol, se actualiza la fila.
 */
export const usuarioEmpresas = pgTable(
  "usuario_empresas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    usuarioId: uuid("usuario_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    empresaId: uuid("empresa_id")
      .notNull()
      .references(() => empresas.id, { onDelete: "cascade" }),
    rol: rolesEnum("rol").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [unique("usuario_empresas_usuario_empresa_unique").on(table.usuarioId, table.empresaId)],
);
