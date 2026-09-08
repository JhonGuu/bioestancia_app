import { and, eq, inArray, isNull } from "drizzle-orm";
import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { DrizzleAdapter } from "@/shared/infra/database/db-connection";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import {
  GrantAccessInput,
  UsuarioEmpresaRepository,
} from "@/modules/users/domain/usuario-empresa.repository";
import {
  EmpresaAcceso,
  UsuarioConAcceso,
  UsuarioEmpresa,
} from "@/modules/users/domain/usuario-empresa";
import { Roles } from "@/modules/users/domain/roles";
import { usuarioEmpresas, users } from "@/modules/users/infra/database/schema";
import { empresas } from "@/modules/empresas/infra/database/schema";
// Cross-module: ver la nota en `users-auth-provider.ts` sobre por qué `users`
// depende acá de `permisos` (resolver rol + permisos juntos en una sola pasada).
import { usuarioEmpresaPermisos } from "@/modules/permisos/infra/database/schema";

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
        usuarioEmpresaId: usuarioEmpresas.id,
        empresaId: empresas.id,
        razonSocial: empresas.razonSocial,
        rubro: empresas.rubro,
        rol: usuarioEmpresas.rol,
      })
      .from(usuarioEmpresas)
      .innerJoin(empresas, eq(empresas.id, usuarioEmpresas.empresaId))
      .where(and(eq(usuarioEmpresas.usuarioId, usuarioId), eq(empresas.activa, true)));

    if (rows.length === 0) return [];

    // Segunda query para los permisos de todos los accesos de una — evita un
    // N+1 (una query de permisos por empresa) y no complica el join de arriba
    // con un GROUP BY/array_agg. Se arma un mapa usuarioEmpresaId -> permisos[].
    const permisoRows = await this.orm.db
      .select({
        usuarioEmpresaId: usuarioEmpresaPermisos.usuarioEmpresaId,
        permiso: usuarioEmpresaPermisos.permiso,
      })
      .from(usuarioEmpresaPermisos)
      .where(inArray(usuarioEmpresaPermisos.usuarioEmpresaId, rows.map((r) => r.usuarioEmpresaId)));

    const permisosPorAcceso = new Map<string, string[]>();
    for (const permisoRow of permisoRows) {
      const lista = permisosPorAcceso.get(permisoRow.usuarioEmpresaId) ?? [];
      lista.push(permisoRow.permiso);
      permisosPorAcceso.set(permisoRow.usuarioEmpresaId, lista);
    }

    return rows.map((row) => ({
      empresaId: row.empresaId,
      razonSocial: row.razonSocial,
      rubro: row.rubro,
      rol: row.rol as Roles,
      permisos: permisosPorAcceso.get(row.usuarioEmpresaId) ?? [],
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

  async listUsuariosForEmpresa(empresaId: string): Promise<UsuarioConAcceso[]> {
    const rows = await this.orm.db
      .select({
        usuarioId: users.id,
        email: users.email,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        phoneNumber: users.phoneNumber,
        isActive: users.isActive,
        mustChangePassword: users.mustChangePassword,
        rol: usuarioEmpresas.rol,
        accesoDesde: usuarioEmpresas.createdAt,
      })
      .from(usuarioEmpresas)
      .innerJoin(users, eq(users.id, usuarioEmpresas.usuarioId))
      .where(and(eq(usuarioEmpresas.empresaId, empresaId), isNull(users.deletedAt)))
      .orderBy(users.firstName, users.lastName);

    return rows.map((row) => ({ ...row, rol: row.rol as Roles }));
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
