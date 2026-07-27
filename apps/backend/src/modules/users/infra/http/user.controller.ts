import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, ApiResponse, Code } from "@/shared/infra/http/api.responses";
import { ExpressAdapter } from "@/shared/infra/http/http-server";
import { RoleGroups } from "@/modules/users/domain/role-groups";
import { UserValidation } from "@/modules/users/infra/http/validation";
import { SignUp, SignUpInput } from "@/modules/users/use-cases/sign-up.use-case";
import { SignIn, SignInInput } from "@/modules/users/use-cases/sign-in.use-case";
import { GetMyAccount } from "@/modules/users/use-cases/get-my-account.use-case";
import { GetMyEmpresas } from "@/modules/users/use-cases/get-my-empresas.use-case";
import {
  GrantEmpresaAccess,
  GrantEmpresaAccessInput,
} from "@/modules/users/use-cases/grant-empresa-access.use-case";
import { Roles } from "@/modules/users/domain/roles";

@injectable()
export class UserController {
  constructor(
    @inject(DI_TYPES.HttpServer) private readonly httpServer: ExpressAdapter,
    @inject(DI_TYPES.UserValidation) private readonly validation: UserValidation,
    @inject(DI_TYPES.SignUp) private readonly signUp: SignUp,
    @inject(DI_TYPES.SignIn) private readonly signIn: SignIn,
    @inject(DI_TYPES.GetMyAccount) private readonly getMyAccount: GetMyAccount,
    @inject(DI_TYPES.GetMyEmpresas) private readonly getMyEmpresas: GetMyEmpresas,
    @inject(DI_TYPES.GrantEmpresaAccess) private readonly grantEmpresaAccess: GrantEmpresaAccess,
  ) {
    this.registerRoutes();
  }

  private registerRoutes(): void {
    // Signup público → crea el usuario SIN acceso a ninguna empresa.
    // El acceso se otorga aparte (ver /account/users y /account/access).
    this.httpServer.register({
      method: "post",
      url: "/account/signup",
      validation: this.validation.signUp,
      handler: async ({ body }) => {
        const data = await this.signUp.execute(body as SignUpInput);
        return new ApiResponse({
          data,
          message: "Usuario creado correctamente",
          status: Code.CREATED,
        });
      },
    });

    // Crear usuario NUEVO + otorgarle acceso a la empresa activa, en un solo paso.
    // Ej: el admin de Bioestancia da de alta a la veterinaria con rol veterinario.
    // SOLO ADMIN de la empresa activa (header X-Empresa-Id).
    this.httpServer.register({
      method: "post",
      url: "/account/users",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminOnly,
      validation: this.validation.createUserByAdmin,
      handler: async ({ body, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const input = body as SignUpInput & { rol: Roles };
        const user = await this.signUp.execute(input);
        const acceso = await this.grantEmpresaAccess.execute({
          email: input.email,
          empresaId: auth.empresaId,
          rol: input.rol,
        });
        return new ApiResponse({
          data: { user, acceso },
          message: "Usuario creado y acceso otorgado correctamente",
          status: Code.CREATED,
        });
      },
    });

    // Otorgar acceso a la empresa activa a un usuario que YA EXISTE (por email).
    // Ej: el contador ya tiene cuenta en Bioestancia, ahora sumale acceso a El Meridiano.
    // SOLO ADMIN de la empresa activa.
    this.httpServer.register({
      method: "post",
      url: "/account/access",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminOnly,
      validation: this.validation.grantAccess,
      handler: async ({ body, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const input = body as GrantEmpresaAccessInput;
        const data = await this.grantEmpresaAccess.execute({
          email: input.email,
          empresaId: auth.empresaId,
          rol: input.rol,
        });
        return new ApiResponse({
          data,
          message: "Acceso otorgado correctamente",
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

    // Perfil del usuario autenticado. No necesita empresa activa.
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

    // Empresas a las que el usuario autenticado tiene acceso (+ su rol en cada una).
    // El frontend la llama después del login para armar el selector de empresa,
    // y de nuevo cuando quiera refrescarlo. No necesita empresa activa.
    this.httpServer.register({
      method: "get",
      url: "/account/empresas",
      auth: "jwt",
      handler: async ({ auth }) => {
        if (!auth) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const data = await this.getMyEmpresas.execute({ userId: auth.userId });
        return new ApiResponse({
          data,
          message: "Empresas obtenidas correctamente",
          status: Code.OK,
        });
      },
    });
  }
}
