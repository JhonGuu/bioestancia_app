import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import {
  AuthenticatedIdentity,
  AuthProvider,
  EmpresaAccess,
} from "@/shared/infra/auth/auth-provider";
import { UserRepository } from "@/modules/users/domain/user.repository";
import { UsuarioEmpresaRepository } from "@/modules/users/domain/usuario-empresa.repository";
import { UsuarioEmpresaPermisoRepository } from "@/modules/permisos/domain/usuario-empresa-permiso.repository";

/**
 * Implementación del AuthProvider. Combina UserRepository (identidad/estado),
 * UsuarioEmpresaRepository (rol por empresa) y UsuarioEmpresaPermisoRepository
 * (permisos granulares por empresa) para resolver todo lo que necesita el
 * middleware de auth ("jwt" y "jwt-empresa") en un solo lugar.
 *
 * NOTA de dependencia cruzada: este archivo vive en `modules/users` pero
 * importa el repo de `modules/permisos` — es intencional (acá se resuelve TODO
 * el acceso de una vez, rol + permisos, contra la DB en cada request) y
 * simétrico a que `modules/permisos` ya depende de `users` para sus use-cases
 * (`SetPermisosUsuario` necesita `UserRepository`/`UsuarioEmpresaRepository`
 * para ubicar a qué acceso cuelga cada permiso). `UsuarioEmpresaPermisoRepository`
 * se bindea temprano en `di.ts` (antes de `registerUsersModule`) para que este
 * constructor pueda pedirlo sin depender del orden de `registerPermisosModule`
 * — mismo patrón que ya usan con `CobroRepository` (ver comentarios en `di.ts`).
 */
@injectable()
export class UsersAuthProvider implements AuthProvider {
  constructor(
    @inject(DI_TYPES.UserRepository) private readonly userRepo: UserRepository,
    @inject(DI_TYPES.UsuarioEmpresaRepository)
    private readonly usuarioEmpresaRepo: UsuarioEmpresaRepository,
    @inject(DI_TYPES.UsuarioEmpresaPermisoRepository)
    private readonly permisoRepo: UsuarioEmpresaPermisoRepository,
  ) {}

  async getIdentity(userId: string): Promise<AuthenticatedIdentity | null> {
    const user = await this.userRepo.getById(userId);
    if (!user) return null;
    return { id: user.id, isActive: user.isActive, mustChangePassword: user.mustChangePassword };
  }

  async getAccessForEmpresa(userId: string, empresaId: string): Promise<EmpresaAccess | null> {
    const access = await this.usuarioEmpresaRepo.findAccess(userId, empresaId);
    if (!access) return null;
    const permisos = await this.permisoRepo.getPermisos(access.id);
    return { rol: access.rol, permisos };
  }
}
