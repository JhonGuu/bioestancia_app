import { hash } from "bcrypt";
import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { Env } from "@/shared/infra/env/env";
import { Logger } from "@/shared/infra/logger/logger";
import { UserRepository } from "@/modules/users/domain/user.repository";
import { toPublicUser, User } from "@/modules/users/domain/user";

/**
 * Crea un usuario "pelado", sin acceso a ninguna empresa todavía.
 * El acceso (rol por empresa) se otorga aparte, vía `GrantEmpresaAccess`
 * — normalmente en el mismo request que da de alta al usuario, desde
 * `POST /account/users` (ver user.controller.ts).
 */
export interface SignUpInput {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

@injectable()
export class SignUp {
  constructor(
    @inject(DI_TYPES.UserRepository) private readonly userRepository: UserRepository,
    @inject(DI_TYPES.Logger) private readonly logger: Logger,
  ) {}

  async execute(input: SignUpInput): Promise<User> {
    const email = input.email.toLowerCase();

    // 1. Validar que no exista otro user con ese email o username
    const existing = await this.userRepository.findByEmailOrUsername(
      email,
      input.username,
    );
    if (existing) {
      throw new ApiError(
        "Email o username ya está en uso",
        Code.CONFLICT,
      );
    }

    // 2. Hashear el password (NUNCA guardar en plano)
    const passwordHash = await hash(input.password, Env.bcryptSalt);

    // 3. Crear el user (sin rol/empresa — eso se otorga aparte)
    const created = await this.userRepository.create({
      email,
      username: input.username,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      phoneNumber: input.phoneNumber ?? null,
    });

    this.logger.info({ userId: created.id }, "User signed up");

    // 4. Devolver la versión "pública" (sin passwordHash)
    return toPublicUser(created);
  }
}
