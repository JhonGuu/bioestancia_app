import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { UsuarioEmpresaRepository } from "@/modules/users/domain/usuario-empresa.repository";
import { UsuarioConAcceso } from "@/modules/users/domain/usuario-empresa";

export interface ListEmpresaUsersInput {
  empresaId: string;
}

/**
 * Lista los usuarios con acceso a la empresa activa, con su rol y datos
 * básicos. Alimenta la pantalla "Usuarios" (`GET /account/users`, admin-only).
 */
@injectable()
export class ListEmpresaUsers {
  constructor(
    @inject(DI_TYPES.UsuarioEmpresaRepository)
    private readonly usuarioEmpresaRepository: UsuarioEmpresaRepository,
  ) {}

  async execute(input: ListEmpresaUsersInput): Promise<UsuarioConAcceso[]> {
    return this.usuarioEmpresaRepository.listUsuariosForEmpresa(input.empresaId);
  }
}
