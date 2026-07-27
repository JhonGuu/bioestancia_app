import { and, eq } from "drizzle-orm";
import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { DrizzleAdapter } from "@/shared/infra/database/db-connection";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import {
  GrantAccessInput,
  UsuarioEmpresaRepository,
} from "@/modules/users/domain/usuario-empresa.repository";
import { EmpresaAcceso, UsuarioEmpresa } from "@/modules/users/domain/usuario-empresa";
import { Roles } from "@/modules/users/domain/roles";
import { usuarioEmpresas } from "@/modules/users/infra/database/schema";
import { empresas } from "@/modules/empresas/infra/database/schema";

@injectable()
export class UsuarioEmpresaRepositoryDrizzle implements UsuarioEmpresaRepository {
  constructor(
    @inject(DI_TYPES.DBConnection) private readonly orm: DrizzleAdapter,
  ) {}

  async findAccess(usuarioId: string, empresaId: string): Promise<UsuarioEmpresa | null> {
    const [row] = await this.orm.db
      .select()
      .from(usuarioEmpresas)
      .where(
        and(
          eq(usuarioEmpresas.usuarioId, usuarioId),
          eq(usuarioEmpresas.empresaId, empresaId),
        ),
      );
    return row ? this.toDomain(row) : null;
  }

  async listEmpresasForUsuario(usuarioId: string): Promise<EmpresaAcceso[]> {
    const rows = await this.orm.db
      .select({
        empresaId: empresas.id,
        razonSocial: empresas.razonSocial,
        rubro: empresas.rubro,
        rol: usuarioEmpresas.rol,
      })
      .from(usuarioEmpresas)
      .innerJoin(empresas, eq(empresas.id, usuarioEmpresas.empresaId))
      .where(and(eq(usuarioEmpresas.usuarioId, usuarioId), eq(empresas.activa, true)));

    return rows.map((row) => ({
      empresaId: row.empresaId,
      razonSocial: row.razonSocial,
      rubro: row.rubro,
      rol: row.rol as Roles,
    }));
  }

  async grantAccess(input: GrantAccessInput): Promise<UsuarioEmpresa> {
    const [row] = await this.orm.db
      .insert(usuarioEmpresas)
      .values({
        usuarioId: input.usuarioId,
        empresaId: input.empresaId,
        rol: input.rol,
      })
      .onConflictDoUpdate({
        target: [usuarioEmpresas.usuarioId, usuarioEmpresas.empresaId],
        set: { rol: input.rol },
      })
      .returning();
    if (!row) {
      throw new ApiError("Failed to grant access", Code.INTERNAL_SERVER_ERROR);
    }
    return this.toDomain(row);
  }

  async revokeAccess(usuarioId: string, empresaId: string): Promise<void> {
    await this.orm.db
      .delete(usuarioEmpresas)
      .where(
        and(
          eq(usuarioEmpresas.usuarioId, usuarioId),
          eq(usuarioEmpresas.empresaId, empresaId),
        ),
      );
  }

  private toDomain(row: typeof usuarioEmpresas.$inferSelect): UsuarioEmpresa {
    return {
      id: row.id,
      usuarioId: row.usuarioId,
      empresaId: row.empresaId,
      rol: row.rol as Roles,
      createdAt: row.createdAt,
    };
  }
}
