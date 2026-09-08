import { pgTable, timestamp, unique, uuid, varchar } from "drizzle-orm/pg-core";

import { usuarioEmpresas } from "@/modules/users/infra/database/schema";

/**
 * Tabla usuario_empresa_permisos: qué permisos granulares (ver
 * `modules/permisos/domain/permiso.ts`) tiene un acceso puntual
 * (usuario+empresa, fila de `usuario_empresas`).
 *
 * DECISIÓN: `permiso` es `varchar`, NO un enum de Postgres (a diferencia de
 * `rol` en `usuario_empresas`). Es a propósito: el catálogo de Roles cambia
 * poco (4 valores fijos, agregar uno es un evento raro), pero el catálogo de
 * Permisos va a seguir creciendo a medida que se sumen pantallas/dashboards
 * nuevos — con un enum de Postgres, cada permiso nuevo pediría una migración
 * (`ALTER TYPE ... ADD VALUE`). Con `varchar`, sumar un permiso es agregar
 * una línea en el enum de TS (`domain/permiso.ts`) y listo, sin tocar la base.
 * La validación de que el código sea uno de los válidos queda a cargo de Zod
 * en la capa HTTP (`z.nativeEnum(Permisos)`) — no de un CHECK de la DB.
 *
 * `unique(usuarioEmpresaId, permiso)`: no tiene sentido otorgar el mismo
 * permiso dos veces al mismo acceso.
 */
export const usuarioEmpresaPermisos = pgTable(
  "usuario_empresa_permisos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    usuarioEmpresaId: uuid("usuario_empresa_id")
      .notNull()
      .references(() => usuarioEmpresas.id, { onDelete: "cascade" }),
    permiso: varchar("permiso", { length: 100 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    unique("usuario_empresa_permisos_usuario_empresa_permiso_unique").on(
      table.usuarioEmpresaId,
      table.permiso,
    ),
  ],
);
