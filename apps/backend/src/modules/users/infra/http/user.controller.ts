import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, ApiResponse, Code } from "@/shared/infra/http/api.responses";
import { ExpressAdapter } from "@/shared/infra/http/http-server";
import { generateTempPassword } from "@/shared/infra/crypto/generate-temp-password";
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
import { ListEmpresaUsers } from "@/modules/users/use-cases/list-empresa-users.use-case";
import { SetUserActive } from "@/modules/users/use-cases/set-user-active.use-case";
import { ChangePassword, ChangePasswordInput } from "@/modules/users/use-cases/change-password.use-case";
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
    @inject(DI_TYPES.ListEmpresaUsers) private readonly listEmpresaUsers: ListEmpresaUsers,
    @inject(DI_TYPES.SetUserActive) private readonly setUserActive: SetUserActive,
    @inject(DI_TYPES.ChangePassword) private readonly changePassword: ChangePassword,
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
    // SOLO ADMIN de la empresa activa (header X-Empresa-Id). La contraseña la
    // genera el sistema (nunca la manda el cliente) y se devuelve UNA SOLA VEZ
    // en la respuesta para que el admin se la pase al usuario nuevo.
    this.httpServer.register({
      method: "post",
      url: "/account/users",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminOnly,
      validation: this.validation.createUserByAdmin,
      handler: async ({ body, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const input = body as Omit<SignUpInput, "password" | "mustChangePassword"> & {
          rol: Roles;
        };
        const temporaryPassword = generateTempPassword();
        const user = await this.signUp.execute({
          ...input,
          password: temporaryPassword,
          mustChangePassword: true,
        });
        const acceso = await this.grantEmpresaAccess.execute({
          email: input.email,
          empresaId: auth.empresaId,
          rol: input.rol,
        });
        return new ApiResponse({
          data: { user, acceso, temporaryPassword },
          message: "Usuario creado y acceso otorgado correctamente",
          status: Code.CREATED,
        });
      },
    });

    // Lista los usuarios con acceso a la empresa activa, con su rol. Pantalla
    // "Usuarios". SOLO ADMIN de la empresa activa.
    this.httpServer.register({
      method: "get",
      url: "/account/users",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminOnly,
      handler: async ({ auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const data = await this.listEmpresaUsers.execute({ empresaId: auth.empresaId });
        return new ApiResponse({
          data,
          message: "Usuarios obtenidos correctamente",
          status: Code.OK,
        });
      },
    });

    // Activa/desactiva un usuario con acceso a la empresa activa. SOLO ADMIN.
    this.httpServer.register({
      method: "patch",
      url: "/account/users/:userId/estado",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminOnly,
      validation: this.validation.setUserActive,
      handler: async ({ params, body, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const { isActive } = body as { isActive: boolean };
        await this.setUserActive.execute({
          targetUserId: params.userId,
          actingUserId: auth.userId,
          empresaId: auth.empresaId,
          isActive,
        });
        return new ApiResponse({
          message: isActive ? "Usuario activado correctamente" : "Usuario desactivado correctamente",
          status: Code.OK,
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

    // Cambio de contraseña del usuario autenticado — voluntario, o forzado
    // cuando `mustChangePassword` está en true (usuario recién creado por un
    // admin con contraseña temporal). No depende de empresa activa: por eso
    // es "jwt" y no "jwt-empresa" — así el usuario puede completarlo ANTES de
    // poder tocar cualquier ruta de negocio (ver HttpServer.buildAuthMiddleware).
    this.httpServer.register({
      method: "post",
      url: "/account/change-password",
      auth: "jwt",
      validation: this.validation.changePassword,
      handler: async ({ body, auth }) => {
        if (!auth) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const input = body as Omit<ChangePasswordInput, "userId">;
        await this.changePassword.execute({ ...input, userId: auth.userId });
        return new ApiResponse({
          message: "Contraseña actualizada correctamente",
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
