import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import {
  AuthenticatedIdentity,
  AuthProvider,
  EmpresaAccess,
} from "@/shared/infra/auth/auth-provider";
import { UserRepository } from "@/modules/users/domain/user.repository";
import { UsuarioEmpresaRepository } from "@/modules/users/domain/usuario-empresa.repository";

/**
 * Implementación del AuthProvider. Combina UserRepository (identidad/estado)
 * con UsuarioEmpresaRepository (rol por empresa) para resolver ambos casos
 * que necesita el middleware de auth ("jwt" y "jwt-empresa").
 */
@injectable()
export class UsersAuthProvider implements AuthProvider {
  constructor(
    @inject(DI_TYPES.UserRepository) private readonly userRepo: UserRepository,
    @inject(DI_TYPES.UsuarioEmpresaRepository)
    private readonly usuarioEmpresaRepo: UsuarioEmpresaRepository,
  ) {}

  async getIdentity(userId: string): Promise<AuthenticatedIdentity | null> {
    const user = await this.userRepo.getById(userId);
    if (!user) return null;
    return { id: user.id, isActive: user.isActive };
  }

  async getAccessForEmpresa(userId: string, empresaId: string): Promise<EmpresaAccess | null> {
    const access = await this.usuarioEmpresaRepo.findAccess(userId, empresaId);
    if (!access) return null;
    return { rol: access.rol };
  }
}
