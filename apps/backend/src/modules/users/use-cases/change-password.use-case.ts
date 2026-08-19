import { compare, hash } from "bcrypt";
import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { Env } from "@/shared/infra/env/env";
import { Logger } from "@/shared/infra/logger/logger";
import { UserRepository } from "@/modules/users/domain/user.repository";

/**
 * Cambia la contraseña del usuario autenticado. Se usa tanto para el cambio
 * voluntario como para el cambio forzado del primer login (`mustChangePassword`)
 * — en ambos casos hay que confirmar la contraseña actual (la temporal, en el
 * caso forzado) antes de setear la nueva. Siempre apaga `mustChangePassword`.
 */
export interface ChangePasswordInput {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

@injectable()
export class ChangePassword {
  constructor(
    @inject(DI_TYPES.UserRepository) private readonly userRepository: UserRepository,
    @inject(DI_TYPES.Logger) private readonly logger: Logger,
  ) {}

  async execute(input: ChangePasswordInput): Promise<void> {
    const user = await this.userRepository.getById(input.userId);
    if (!user) {
      throw new ApiError("Usuario no encontrado", Code.NOT_FOUND);
    }

    const isValid = await compare(input.currentPassword, user.passwordHash);
    if (!isValid) {
      throw new ApiError("La contraseña actual no es correcta", Code.UNAUTHORIZED);
    }

    const passwordHash = await hash(input.newPassword, Env.bcryptSalt);
    await this.userRepository.updatePassword(input.userId, passwordHash);

    this.logger.info({ userId: input.userId }, "Contraseña cambiada");
  }
}
