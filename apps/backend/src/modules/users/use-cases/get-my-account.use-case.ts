import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { UserRepository } from "@/modules/users/domain/user.repository";
import { toPublicUser, User } from "@/modules/users/domain/user";

export interface GetMyAccountInput {
  userId: string;
}

@injectable()
export class GetMyAccount {
  constructor(
    @inject(DI_TYPES.UserRepository) private readonly userRepository: UserRepository,
  ) {}

  async execute(input: GetMyAccountInput): Promise<User> {
    const user = await this.userRepository.getById(input.userId);
    if (!user) {
      throw new ApiError("Usuario no encontrado", Code.NOT_FOUND);
    }
    return toPublicUser(user);
  }
}
