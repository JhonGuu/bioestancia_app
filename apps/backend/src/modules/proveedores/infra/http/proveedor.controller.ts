import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, ApiResponse, Code } from "@/shared/infra/http/api.responses";
import { ExpressAdapter } from "@/shared/infra/http/http-server";
import { RoleGroups } from "@/modules/users/domain/role-groups";
import { ProveedorValidation } from "@/modules/proveedores/infra/http/validation";
import { CreateProveedor } from "@/modules/proveedores/use-cases/create-proveedor.use-case";
import { ListProveedores } from "@/modules/proveedores/use-cases/list-proveedores.use-case";
import { GetProveedor } from "@/modules/proveedores/use-cases/get-proveedor.use-case";
import { CreateProveedorInput } from "@/modules/proveedores/domain/proveedor.repository";

@injectable()
export class ProveedorController {
  constructor(
    @inject(DI_TYPES.HttpServer) private readonly httpServer: ExpressAdapter,
    @inject(DI_TYPES.ProveedorValidation) private readonly validation: ProveedorValidation,
    @inject(DI_TYPES.CreateProveedor) private readonly createProveedor: CreateProveedor,
    @inject(DI_TYPES.ListProveedores) private readonly listProveedores: ListProveedores,
    @inject(DI_TYPES.GetProveedor) private readonly getProveedor: GetProveedor,
  ) {
    this.registerRoutes();
  }

  private registerRoutes(): void {
    // Admin + contable: alta de proveedores es una tarea comercial/administrativa.
    this.httpServer.register({
      method: "post",
      url: "/proveedores",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.create,
      handler: async ({ body, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const input = body as Omit<CreateProveedorInput, "empresaId">;
        const data = await this.createProveedor.execute({ ...input, empresaId: auth.empresaId });
        return new ApiResponse({
          data,
          message: "Proveedor creado correctamente",
          status: Code.CREATED,
        });
      },
    });

    // Lectura: cualquier usuario con acceso a la empresa activa.
    this.httpServer.register({
      method: "get",
      url: "/proveedores",
      auth: "jwt-empresa",
      handler: async ({ auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const data = await this.listProveedores.execute({ empresaId: auth.empresaId });
        return new ApiResponse({
          data,
          message: "Proveedores obtenidos correctamente",
          status: Code.OK,
        });
      },
    });

    this.httpServer.register({
      method: "get",
      url: "/proveedores/:id",
      auth: "jwt-empresa",
      validation: this.validation.getById,
      handler: async ({ params, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const data = await this.getProveedor.execute({ id: params.id, empresaId: auth.empresaId });
        return new ApiResponse({
          data,
          message: "Proveedor obtenido correctamente",
          status: Code.OK,
        });
      },
    });
  }
}
