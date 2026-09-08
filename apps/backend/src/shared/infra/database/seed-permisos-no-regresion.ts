// Polyfill de Reflect.metadata — necesario para que Inversify funcione al
// levantar el container fuera del bootstrap normal de index.ts.
import "reflect-metadata";
import { inArray } from "drizzle-orm";

import { DI } from "@/shared/infra/di/di";
import { DI_TYPES } from "@/shared/infra/di/types";
import { Logger } from "@/shared/infra/logger/logger";
import { DrizzleAdapter } from "@/shared/infra/database/db-connection";
import { usuarioEmpresas } from "@/modules/users/infra/database/schema";
import { usuarioEmpresaPermisos } from "@/modules/permisos/infra/database/schema";
import { Roles } from "@/modules/users/domain/roles";
import { Permisos } from "@/modules/permisos/domain/permiso";

/**
 * Seed de NO-REGRESIÓN para el sistema de permisos granulares (ver
 * `modules/permisos` y el plan en el proyecto BIOESTANCIA).
 *
 * Contexto: 7 rutas que antes eran visibles para admin/contable (o, en el
 * caso de listas de precios y liquidaciones, para CUALQUIERA con acceso a la
 * empresa) ahora exigen un permiso granular explícito además del rol. Como
 * todavía no existe la pantalla para que el admin otorgue esos permisos
 * persona por persona, sin este script nadie los tendría el día que se
 * despliegue este cambio — las 7 vistas quedarían apagadas para todos.
 *
 * Qué hace: a cada fila de `usuario_empresas` con rol `admin` o `contable`
 * le otorga TODOS los permisos del catálogo — restaura exactamente el
 * comportamiento de antes de este cambio. De acá en más, Juan Jose ajusta
 * manualmente quién ve qué (cuando exista la pantalla, o directo por SQL
 * mientras tanto).
 *
 * Es idempotente (usa `onConflictDoNothing`): correrlo de nuevo no duplica
 * nada ni pisa permisos que ya hayan sido ajustados a mano.
 *
 * Uso: pnpm db:seed-permisos
 */
async function seedPermisosNoRegresion(): Promise<void> {
  const container = DI.getInstance().container;
  const logger = container.get<Logger>(DI_TYPES.Logger);
  const orm = container.get<DrizzleAdapter>(DI_TYPES.DBConnection);

  const accesos = await orm.db
    .select({ id: usuarioEmpresas.id, rol: usuarioEmpresas.rol })
    .from(usuarioEmpresas)
    .where(inArray(usuarioEmpresas.rol, [Roles.ADMIN, Roles.CONTABLE]));

  if (accesos.length === 0) {
    logger.info("No hay usuarios con rol admin/contable — nada para sembrar.");
    return;
  }

  const todosLosPermisos = Object.values(Permisos);
  const filas = accesos.flatMap((acceso) =>
    todosLosPermisos.map((permiso) => ({ usuarioEmpresaId: acceso.id, permiso })),
  );

  await orm.db.insert(usuarioEmpresaPermisos).values(filas).onConflictDoNothing();

  logger.info(
    { accesos: accesos.length, permisosPorAcceso: todosLosPermisos.length },
    "Seed de no-regresión de permisos completado",
  );
}

seedPermisosNoRegresion()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
