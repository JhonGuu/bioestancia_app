import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, ApiResponse, Code } from "@/shared/infra/http/api.responses";
import { ExpressAdapter } from "@/shared/infra/http/http-server";
import { RoleGroups } from "@/modules/users/domain/role-groups";
import { PermisoValidation } from "@/modules/permisos/infra/http/validation";
import { SetPermisosUsuario, SetPermisosUsuarioInput } from "@/modules/permisos/use-cases/set-permisos-usuario.use-case";
import { GetPermisosUsuario } from "@/modules/permisos/use-cases/get-permisos-usuario.use-case";
import { GetPermisosCatalogo } from "@/modules/permisos/use-cases/get-permisos-catalogo.use-case";

@injectable()
export class PermisoController {
  constructor(
    @inject(DI_TYPES.HttpServer) private readonly httpServer: ExpressAdapter,
    @inject(DI_TYPES.PermisoValidation) private readonly validation: PermisoValidation,
    @inject(DI_TYPES.SetPermisosUsuario) private readonly setPermisosUsuario: SetPermisosUsuario,
    @inject(DI_TYPES.GetPermisosUsuario) private readonly getPermisosUsuario: GetPermisosUsuario,
    @inject(DI_TYPES.GetPermisosCatalogo) private readonly getPermisosCatalogo: GetPermisosCatalogo,
  ) {
    this.registerRoutes();
  }

  private registerRoutes(): void {
    // Catálogo completo con metadata (categoría/etiqueta/descripción) — para
    // pintar los checkboxes del diálogo "Permisos". Va ANTES que la ruta
    // /account/permisos/:usuarioId de abajo (mismo prefijo, Express matchea
    // en orden de registro).
    this.httpServer.register({
      method: "get",
      url: "/account/permisos/catalogo",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminOnly,
      handler: async () => {
        return new ApiResponse({
          data: this.getPermisosCatalogo.execute(),
          message: "Catálogo de permisos obtenido correctamente",
          status: Code.OK,
        });
      },
    });

    // Permisos vigentes de un usuario puntual en la empresa activa — para
    // prefillear el diálogo "Permisos" al abrirlo.
    this.httpServer.register({
      method: "get",
      url: "/account/permisos/:usuarioId",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminOnly,
      validation: this.validation.getPermisosUsuario,
      handler: async ({ params, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const data = await this.getPermisosUsuario.execute({
          usuarioId: params.usuarioId,
          empresaId: auth.empresaId,
        });
        return new ApiResponse({
          data,
          message: "Permisos obtenidos correctamente",
          status: Code.OK,
        });
      },
    });

    // Reemplaza el set completo de permisos de un usuario (por email) en la
    // empresa activa. SOLO ADMIN — igual que /account/access (rol).
    this.httpServer.register({
      method: "put",
      url: "/account/permisos",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminOnly,
      validation: this.validation.setPermisos,
      handler: async ({ body, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const input = body as Omit<SetPermisosUsuarioInput, "empresaId">;
        const data = await this.setPermisosUsuario.execute({ ...input, empresaId: auth.empresaId });
        return new ApiResponse({
          data,
          message: "Permisos actualizados correctamente",
          status: Code.OK,
        });
      },
    });
  }
}
