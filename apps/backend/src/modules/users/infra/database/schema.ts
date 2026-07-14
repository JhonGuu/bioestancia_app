import {
  boolean,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { Roles } from "@/modules/users/domain/roles";

/**
 * Enum de Postgres para el campo role.
 * Lo derivamos del enum TS para que estén siempre sincronizados.
 * Object.values(Roles) porque puede ir creciendo (admin, veterinario, operario, etc).
 */
export const rolesEnum = pgEnum("user_role", Object.values(Roles) as [string, ...string[]]);

/**
 * Tabla users. Convenciones:
 *   - PK: uuid generado por Postgres con `defaultRandom()`.
 *   - Soft delete: `deletedAt` nullable. Si no es null, el user está "borrado".
 *   - Auditoría: `createdAt` y `updatedAt`.
 *   - Email y username son únicos.
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  phoneNumber: varchar("phone_number", { length: 20 }),
  role: rolesEnum("role").notNull().default(Roles.ADMIN),
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});
