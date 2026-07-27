import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, ApiResponse, Code } from "@/shared/infra/http/api.responses";
import { ExpressAdapter } from "@/shared/infra/http/http-server";
import { RoleGroups } from "@/modules/users/domain/role-groups";
import { VentaValidation } from "@/modules/ventas/infra/http/validation";
import { CreateVenta, CreateVentaUseCaseInput } from "@/modules/ventas/use-cases/create-venta.use-case";
import { ListVentas } from "@/modules/ventas/use-cases/list-ventas.use-case";
import { GetVenta } from "@/modules/ventas/use-cases/get-venta.use-case";

@injectable()
export class VentaController {
  constructor(
    @inject(DI_TYPES.HttpServer) private readonly httpServer: ExpressAdapter,
    @inject(DI_TYPES.VentaValidation) private readonly validation: VentaValidation,
    @inject(DI_TYPES.CreateVenta) private readonly createVenta: CreateVenta,
    @inject(DI_TYPES.ListVentas) private readonly listVentas: ListVentas,
    @inject(DI_TYPES.GetVenta) private readonly getVenta: GetVenta,
  ) {
    this.registerRoutes();
  }

  private registerRoutes(): void {
    // Admin + contable: cargar una venta es una tarea comercial/administrativa.
    this.httpServer.register({
      method: "post",
      url: "/ventas",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.create,
      handler: async ({ body, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const input = body as Omit<CreateVentaUseCaseInput, "empresaId">;
        const data = await this.createVenta.execute({ ...input, empresaId: auth.empresaId });
        return new ApiResponse({
          data,
          message: "Venta creada correctamente",
          status: Code.CREATED,
        });
      },
    });

    // Lectura: cualquier usuario con acceso a la empresa activa.
    this.httpServer.register({
      method: "get",
      url: "/ventas",
      auth: "jwt-empresa",
      handler: async ({ auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const data = await this.listVentas.execute({ empresaId: auth.empresaId });
        return new ApiResponse({
          data,
          message: "Ventas obtenidas correctamente",
          status: Code.OK,
        });
      },
    });

    this.httpServer.register({
      method: "get",
      url: "/ventas/:id",
      auth: "jwt-empresa",
      validation: this.validation.getById,
      handler: async ({ params, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const data = await this.getVenta.execute({ id: params.id, empresaId: auth.empresaId });
        return new ApiResponse({
          data,
          message: "Venta obtenida correctamente",
          status: Code.OK,
        });
      },
    });
  }
}
