import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { Logger } from "@/shared/infra/logger/logger";
import { UserRepository } from "@/modules/users/domain/user.repository";
import { UsuarioEmpresaRepository } from "@/modules/users/domain/usuario-empresa.repository";
import { UsuarioEmpresa } from "@/modules/users/domain/usuario-empresa";
import { Roles } from "@/modules/users/domain/roles";

/**
 * Otorga acceso a una empresa a un usuario que YA EXISTE (buscado por email),
 * con un rol determinado. Uso típico: el contador ya tiene cuenta en
 * Bioestancia y ahora también necesita operar El Meridiano.
 *
 * Para "crear un usuario nuevo y darle acceso" en un solo paso (caso típico:
 * dar de alta a la veterinaria), ver `POST /account/users` en user.controller.ts,
 * que encadena `SignUp` + este use-case.
 */
export interface GrantEmpresaAccessInput {
  email: string;
  empresaId: string;
  rol: Roles;
}

@injectable()
export class GrantEmpresaAccess {
  constructor(
    @inject(DI_TYPES.UserRepository) private readonly userRepository: UserRepository,
    @inject(DI_TYPES.UsuarioEmpresaRepository)
    private readonly usuarioEmpresaRepository: UsuarioEmpresaRepository,
    @inject(DI_TYPES.Logger) private readonly logger: Logger,
  ) {}

  async execute(input: GrantEmpresaAccessInput): Promise<UsuarioEmpresa> {
    const user = await this.userRepository.getByEmail(input.email.toLowerCase());
    if (!user) {
      throw new ApiError("No existe un usuario con ese email", Code.NOT_FOUND);
    }

    const access = await this.usuarioEmpresaRepository.grantAccess({
      usuarioId: user.id,
      empresaId: input.empresaId,
      rol: input.rol,
    });

    this.logger.info(
      { userId: user.id, empresaId: input.empresaId, rol: input.rol },
      "Acceso a empresa otorgado",
    );

    return access;
  }
}
