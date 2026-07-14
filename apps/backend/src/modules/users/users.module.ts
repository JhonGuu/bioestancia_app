import { Container } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { UserController } from "@/modules/users/infra/http/user.controller";
import { UserValidation } from "@/modules/users/infra/http/validation";
import { UserRepositoryDrizzle } from "@/modules/users/infra/repository/user.repository";
import { UsersAuthProvider } from "@/modules/users/infra/users-auth-provider";
import { GetMyAccount } from "@/modules/users/use-cases/get-my-account.use-case";
import { SignIn } from "@/modules/users/use-cases/sign-in.use-case";
import { SignUp } from "@/modules/users/use-cases/sign-up.use-case";

/**
 * Registra todas las dependencias del módulo `users` en el container.
 *
 * Convención por módulo:
 *   1. Validations
 *   2. Repositories
 *   3. Use-cases
 *   4. Controller (último: depende de los anteriores)
 *
 * El controller se hace `.get()` para forzar su instanciación al inicio
 * (sin esto, las rutas no se registran hasta que alguien lo pida explícitamente).
 */
export function registerUsersModule(container: Container): void {
  // Validations
  container.bind(DI_TYPES.UserValidation).to(UserValidation);

  // Repositories
  container.bind(DI_TYPES.UserRepository).to(UserRepositoryDrizzle);

  // AuthProvider (lo expone shared/infra/http/http-server.ts vía DI_TYPES.AuthProvider)
  container.bind(DI_TYPES.AuthProvider).to(UsersAuthProvider);

  // Use-cases
  container.bind(DI_TYPES.SignUp).to(SignUp);
  container.bind(DI_TYPES.SignIn).to(SignIn);
  container.bind(DI_TYPES.GetMyAccount).to(GetMyAccount);

  // Controller (instanciado eagerly para que registre rutas en el HttpServer)
  container.bind(DI_TYPES.UserController).to(UserController);
  container.get(DI_TYPES.UserController);
}
