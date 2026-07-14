import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import {
  AuthenticatedUser,
  AuthProvider,
} from "@/shared/infra/auth/auth-provider";
import { UserRepository } from "@/modules/users/domain/user.repository";

/**
 * Implementación del AuthProvider que consulta el UserRepository.
 */
@injectable()
export class UsersAuthProvider implements AuthProvider {
  constructor(
    @inject(DI_TYPES.UserRepository) private readonly userRepo: UserRepository,
  ) {}

  async getAuthenticatedUser(userId: string): Promise<AuthenticatedUser | null> {
    const user = await this.userRepo.getById(userId);
    if (!user) return null;
    return {
      id: user.id,
      role: user.role,
      isActive: user.isActive,
    };
  }
}
