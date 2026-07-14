import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, ApiResponse, Code } from "@/shared/infra/http/api.responses";
import { ExpressAdapter } from "@/shared/infra/http/http-server";
import { RoleGroups } from "@/modules/users/domain/role-groups";
import { Roles } from "@/modules/users/domain/roles";
import { UserValidation } from "@/modules/users/infra/http/validation";
import { SignUp, SignUpInput } from "@/modules/users/use-cases/sign-up.use-case";
import { SignIn, SignInInput } from "@/modules/users/use-cases/sign-in.use-case";
import { GetMyAccount } from "@/modules/users/use-cases/get-my-account.use-case";

@injectable()
export class UserController {
  constructor(
    @inject(DI_TYPES.HttpServer) private readonly httpServer: ExpressAdapter,
    @inject(DI_TYPES.UserValidation) private readonly validation: UserValidation,
    @inject(DI_TYPES.SignUp) private readonly signUp: SignUp,
    @inject(DI_TYPES.SignIn) private readonly signIn: SignIn,
    @inject(DI_TYPES.GetMyAccount) private readonly getMyAccount: GetMyAccount,
  ) {
    this.registerRoutes();
  }

  private registerRoutes(): void {
    // Signup público → por ahora siempre ADMIN (único rol existente).
    this.httpServer.register({
      method: "post",
      url: "/account/signup",
      validation: this.validation.signUp,
      handler: async ({ body }) => {
        const input = { ...(body as Omit<SignUpInput, "role">), role: Roles.ADMIN };
        const data = await this.signUp.execute(input);
        return new ApiResponse({
          data,
          message: "Usuario creado correctamente",
          status: Code.CREATED,
        });
      },
    });

    // Crear usuario con rol arbitrario — SOLO ADMIN. Queda listo para cuando sumes roles nuevos.
    this.httpServer.register({
      method: "post",
      url: "/account/users",
      auth: "jwt",
      roles: RoleGroups.AdminOnly,
      validation: this.validation.createUserByAdmin,
      handler: async ({ body }) => {
        const data = await this.signUp.execute(body as SignUpInput);
        return new ApiResponse({
          data,
          message: "Usuario creado correctamente",
          status: Code.CREATED,
        });
      },
    });

    this.httpServer.register({
      method: "post",
      url: "/account/signin",
      validation: this.validation.signIn,
      handler: async ({ body }) => {
        const data = await this.signIn.execute(body as SignInInput);
        return new ApiResponse({
          data,
          message: "Inicio de sesión exitoso",
          status: Code.OK,
        });
      },
    });

    this.httpServer.register({
      method: "get",
      url: "/account/me",
      auth: "jwt",
      handler: async ({ auth }) => {
        if (!auth) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const data = await this.getMyAccount.execute({ userId: auth.userId });
        return new ApiResponse({
          data,
          message: "Usuario obtenido correctamente",
          status: Code.OK,
        });
      },
    });
  }
}
