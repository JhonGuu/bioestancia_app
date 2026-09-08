import { eq } from "drizzle-orm";
import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { DrizzleAdapter } from "@/shared/infra/database/db-connection";
import { UsuarioEmpresaPermisoRepository } from "@/modules/permisos/domain/usuario-empresa-permiso.repository";
import { Permisos } from "@/modules/permisos/domain/permiso";
import { usuarioEmpresaPermisos } from "@/modules/permisos/infra/database/schema";

@injectable()
export class UsuarioEmpresaPermisoRepositoryDrizzle implements UsuarioEmpresaPermisoRepository {
  constructor(@inject(DI_TYPES.DBConnection) private readonly orm: DrizzleAdapter) {}

  async getPermisos(usuarioEmpresaId: string): Promise<Permisos[]> {
    const rows = await this.orm.db
      .select({ permiso: usuarioEmpresaPermisos.permiso })
      .from(usuarioEmpresaPermisos)
      .where(eq(usuarioEmpresaPermisos.usuarioEmpresaId, usuarioEmpresaId));
    return rows.map((row) => row.permiso as Permisos);
  }

  /**
   * Reemplaza el set completo: borra todo lo que tenía ese acceso y carga
   * la lista nueva, en una transacción (así no queda un estado a medio
   * escribir si algo falla a mitad de camino).
   */
  async setPermisos(usuarioEmpresaId: string, permisos: Permisos[]): Promise<void> {
    await this.orm.db.transaction(async (tx) => {
      await tx
        .delete(usuarioEmpresaPermisos)
        .where(eq(usuarioEmpresaPermisos.usuarioEmpresaId, usuarioEmpresaId));

      if (permisos.length === 0) return;

      await tx.insert(usuarioEmpresaPermisos).values(
        permisos.map((permiso) => ({ usuarioEmpresaId, permiso })),
      );
    });
  }
}
