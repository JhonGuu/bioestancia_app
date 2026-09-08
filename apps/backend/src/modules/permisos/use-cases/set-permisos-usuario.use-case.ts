import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { Logger } from "@/shared/infra/logger/logger";
import { UserRepository } from "@/modules/users/domain/user.repository";
import { UsuarioEmpresaRepository } from "@/modules/users/domain/usuario-empresa.repository";
import { UsuarioEmpresaPermisoRepository } from "@/modules/permisos/domain/usuario-empresa-permiso.repository";
import { Permisos } from "@/modules/permisos/domain/permiso";

/**
 * Reemplaza el set completo de permisos de un usuario en la empresa activa
 * (admin-only). Mismo patrón que `GrantEmpresaAccess`: identifica al usuario
 * por email, resuelve su acceso (fila de `usuario_empresas`) a la empresa
 * activa, y ahí cuelga los permisos — nunca a un usuario "en abstracto".
 */
export interface SetPermisosUsuarioInput {
  email: string;
  empresaId: string;
  permisos: Permisos[];
}

@injectable()
export class SetPermisosUsuario {
  constructor(
    @inject(DI_TYPES.UserRepository) private readonly userRepository: UserRepository,
    @inject(DI_TYPES.UsuarioEmpresaRepository)
    private readonly usuarioEmpresaRepository: UsuarioEmpresaRepository,
    @inject(DI_TYPES.UsuarioEmpresaPermisoRepository)
    private readonly permisoRepository: UsuarioEmpresaPermisoRepository,
    @inject(DI_TYPES.Logger) private readonly logger: Logger,
  ) {}

  async execute(input: SetPermisosUsuarioInput): Promise<Permisos[]> {
    const user = await this.userRepository.getByEmail(input.email.toLowerCase());
    if (!user) {
      throw new ApiError("No existe un usuario con ese email", Code.NOT_FOUND);
    }

    const access = await this.usuarioEmpresaRepository.findAccess(user.id, input.empresaId);
    if (!access) {
      throw new ApiError("El usuario no tiene acceso a esta empresa", Code.NOT_FOUND);
    }

    await this.permisoRepository.setPermisos(access.id, input.permisos);

    this.logger.info(
      { userId: user.id, empresaId: input.empresaId, permisos: input.permisos },
      "Permisos de usuario actualizados",
    );

    return input.permisos;
  }
}
