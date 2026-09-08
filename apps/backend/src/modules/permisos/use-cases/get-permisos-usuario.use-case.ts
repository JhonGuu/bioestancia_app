import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { UsuarioEmpresaRepository } from "@/modules/users/domain/usuario-empresa.repository";
import { UsuarioEmpresaPermisoRepository } from "@/modules/permisos/domain/usuario-empresa-permiso.repository";
import { Permisos } from "@/modules/permisos/domain/permiso";

export interface GetPermisosUsuarioInput {
  usuarioId: string;
  empresaId: string;
}

/** Permisos vigentes de un usuario en la empresa activa — alimenta el diálogo "Permisos" al abrirlo. */
@injectable()
export class GetPermisosUsuario {
  constructor(
    @inject(DI_TYPES.UsuarioEmpresaRepository)
    private readonly usuarioEmpresaRepository: UsuarioEmpresaRepository,
    @inject(DI_TYPES.UsuarioEmpresaPermisoRepository)
    private readonly permisoRepository: UsuarioEmpresaPermisoRepository,
  ) {}

  async execute(input: GetPermisosUsuarioInput): Promise<Permisos[]> {
    const access = await this.usuarioEmpresaRepository.findAccess(input.usuarioId, input.empresaId);
    if (!access) {
      throw new ApiError("El usuario no tiene acceso a esta empresa", Code.NOT_FOUND);
    }
    return this.permisoRepository.getPermisos(access.id);
  }
}
