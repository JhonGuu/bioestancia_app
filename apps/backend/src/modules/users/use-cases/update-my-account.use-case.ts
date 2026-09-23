import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { UserRepository } from "@/modules/users/domain/user.repository";
import { toPublicUser, User } from "@/modules/users/domain/user";

export interface UpdateMyAccountInput {
  userId: string;
  firstName: string;
  lastName: string;
  /** `null`, vacío u omitido borra el teléfono. */
  phoneNumber?: string | null;
}

/**
 * El usuario autenticado edita SUS datos personales (nombre, apellido,
 * teléfono). A propósito NO permite cambiar `email` ni `username`: el email
 * es la credencial de login y cambiarlo pide un flujo aparte (confirmar
 * contraseña, verificar el nuevo email). Los datos bancarios (CBU) viven en
 * el legajo del empleado, no en el usuario.
 */
@injectable()
export class UpdateMyAccount {
  constructor(
    @inject(DI_TYPES.UserRepository) private readonly userRepository: UserRepository,
  ) {}

  async execute(input: UpdateMyAccountInput): Promise<User> {
    const existente = await this.userRepository.getById(input.userId);
    if (!existente) {
      throw new ApiError("Usuario no encontrado", Code.NOT_FOUND);
    }

    const actualizado = await this.userRepository.updateProfile(input.userId, {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      phoneNumber: input.phoneNumber?.trim() ? input.phoneNumber.trim() : null,
    });
    return toPublicUser(actualizado);
  }
}
