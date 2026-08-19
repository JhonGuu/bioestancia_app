import { eq, isNull, and, or } from "drizzle-orm";
import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { DrizzleAdapter } from "@/shared/infra/database/db-connection";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import {
  CreateUserInput,
  UserRepository,
} from "@/modules/users/domain/user.repository";
import { UserWithCredentials } from "@/modules/users/domain/user";
import { users } from "@/modules/users/infra/database/schema";

/**
 * Implementación del UserRepository usando Drizzle ORM sobre PostgreSQL.
 *
 * Notá que esta clase implementa la interface UserRepository definida en domain/.
 * Eso permite que los use-cases dependan de la interface, no de Drizzle directamente.
 */
@injectable()
export class UserRepositoryDrizzle implements UserRepository {
  constructor(
    @inject(DI_TYPES.DBConnection) private readonly orm: DrizzleAdapter,
  ) {}

  async getById(id: string): Promise<UserWithCredentials | null> {
    const [row] = await this.orm.db
      .select()
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)));
    return row ? this.toDomain(row) : null;
  }

  async getByEmail(email: string): Promise<UserWithCredentials | null> {
    const [row] = await this.orm.db
      .select()
      .from(users)
      .where(and(eq(users.email, email.toLowerCase()), isNull(users.deletedAt)));
    return row ? this.toDomain(row) : null;
  }

  async findByEmailOrUsername(
    email: string,
    username: string,
  ): Promise<UserWithCredentials | null> {
    const [row] = await this.orm.db
      .select()
      .from(users)
      .where(
        and(
          or(eq(users.email, email.toLowerCase()), eq(users.username, username)),
          isNull(users.deletedAt),
        ),
      );
    return row ? this.toDomain(row) : null;
  }

  async create(input: CreateUserInput): Promise<UserWithCredentials> {
    const [row] = await this.orm.db
      .insert(users)
      .values({
        email: input.email.toLowerCase(),
        username: input.username,
        passwordHash: input.passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        phoneNumber: input.phoneNumber,
        mustChangePassword: input.mustChangePassword ?? false,
      })
      .returning();
    if (!row) {
      throw new ApiError("Failed to create user", Code.INTERNAL_SERVER_ERROR);
    }
    return this.toDomain(row);
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.orm.db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, userId));
  }

  async setActive(userId: string, isActive: boolean): Promise<void> {
    await this.orm.db
      .update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await this.orm.db
      .update(users)
      .set({ passwordHash, mustChangePassword: false, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  /**
   * Mapper: convierte una fila de la tabla `users` a la representación del dominio.
   * Acá centralizamos cualquier transformación entre DB <-> dominio.
   */
  private toDomain(row: typeof users.$inferSelect): UserWithCredentials {
    return {
      id: row.id,
      email: row.email,
      username: row.username,
      passwordHash: row.passwordHash,
      firstName: row.firstName,
      lastName: row.lastName,
      phoneNumber: row.phoneNumber,
      isActive: row.isActive,
      mustChangePassword: row.mustChangePassword,
      createdAt: row.createdAt,
    };
  }
}
