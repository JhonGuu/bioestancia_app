import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { UsuarioEmpresaRepository } from "@/modules/users/domain/usuario-empresa.repository";
import { EmpresaAcceso } from "@/modules/users/domain/usuario-empresa";

export interface GetMyEmpresasInput {
  userId: string;
}

/**
 * Devuelve las empresas a las que el usuario autenticado tiene acceso, con su
 * rol en cada una. Lo usa `GET /account/empresas` — se puede llamar en
 * cualquier momento (no solo al login) para refrescar el selector de empresa
 * del frontend, por ejemplo si le acaban de otorgar acceso a una empresa nueva.
 */
@injectable()
export class GetMyEmpresas {
  constructor(
    @inject(DI_TYPES.UsuarioEmpresaRepository)
    private readonly usuarioEmpresaRepository: UsuarioEmpresaRepository,
  ) {}

  async execute(input: GetMyEmpresasInput): Promise<EmpresaAcceso[]> {
    return this.usuarioEmpresaRepository.listEmpresasForUsuario(input.userId);
  }
}
