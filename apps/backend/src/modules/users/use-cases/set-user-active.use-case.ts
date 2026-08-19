import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { Logger } from "@/shared/infra/logger/logger";
import { UserRepository } from "@/modules/users/domain/user.repository";
import { UsuarioEmpresaRepository } from "@/modules/users/domain/usuario-empresa.repository";

/**
 * Activa o desactiva un usuario. Reutiliza `User.isActive` (ya usado por
 * `SignIn` para bloquear el login) — no hay estado nuevo que modelar.
 *
 * Alcance: solo se puede accionar sobre un usuario que tenga acceso a la
 * empresa activa (el admin no puede tocar usuarios de otras empresas), y no
 * te podés desactivar a vos mismo.
 */
export interface SetUserActiveInput {
  targetUserId: string;
  actingUserId: string;
  empresaId: string;
  isActive: boolean;
}

@injectable()
export class SetUserActive {
  constructor(
    @inject(DI_TYPES.UserRepository) private readonly userRepository: UserRepository,
    @inject(DI_TYPES.UsuarioEmpresaRepository)
    private readonly usuarioEmpresaRepository: UsuarioEmpresaRepository,
    @inject(DI_TYPES.Logger) private readonly logger: Logger,
  ) {}

  async execute(input: SetUserActiveInput): Promise<void> {
    if (input.targetUserId === input.actingUserId) {
      throw new ApiError("No podés desactivarte a vos mismo", Code.BAD_REQUEST);
    }

    const access = await this.usuarioEmpresaRepository.findAccess(
      input.targetUserId,
      input.empresaId,
    );
    if (!access) {
      throw new ApiError("Ese usuario no tiene acceso a esta empresa", Code.NOT_FOUND);
    }

    await this.userRepository.setActive(input.targetUserId, input.isActive);

    this.logger.info(
      { targetUserId: input.targetUserId, isActive: input.isActive },
      input.isActive ? "Usuario activado" : "Usuario desactivado",
    );
  }
}
