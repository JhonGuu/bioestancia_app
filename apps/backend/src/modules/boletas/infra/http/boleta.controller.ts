import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, ApiResponse, Code } from "@/shared/infra/http/api.responses";
import { ExpressAdapter } from "@/shared/infra/http/http-server";
import { RoleGroups } from "@/modules/users/domain/role-groups";
import { BoletaValidation } from "@/modules/boletas/infra/http/validation";
import { CreateBoleta } from "@/modules/boletas/use-cases/create-boleta.use-case";
import { ListBoletas } from "@/modules/boletas/use-cases/list-boletas.use-case";
import { GetBoleta } from "@/modules/boletas/use-cases/get-boleta.use-case";
import { CreateBoletaInput } from "@/modules/boletas/domain/boleta.repository";

@injectable()
export class BoletaController {
  constructor(
    @inject(DI_TYPES.HttpServer) private readonly httpServer: ExpressAdapter,
    @inject(DI_TYPES.BoletaValidation) private readonly validation: BoletaValidation,
    @inject(DI_TYPES.CreateBoleta) private readonly createBoleta: CreateBoleta,
    @inject(DI_TYPES.ListBoletas) private readonly listBoletas: ListBoletas,
    @inject(DI_TYPES.GetBoleta) private readonly getBoleta: GetBoleta,
  ) {
    this.registerRoutes();
  }

  private registerRoutes(): void {
    // Admin + contable: cargar una boleta es una tarea comercial/administrativa.
    this.httpServer.register({
      method: "post",
      url: "/boletas",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.create,
      handler: async ({ body, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const input = body as Omit<CreateBoletaInput, "empresaId">;
        const data = await this.createBoleta.execute({ ...input, empresaId: auth.empresaId });
        return new ApiResponse({
          data,
          message: "Boleta creada correctamente",
          status: Code.CREATED,
        });
      },
    });

    // Lectura: cualquier usuario con acceso a la empresa activa.
    this.httpServer.register({
      method: "get",
      url: "/boletas",
      auth: "jwt-empresa",
      handler: async ({ auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const data = await this.listBoletas.execute({ empresaId: auth.empresaId });
        return new ApiResponse({
          data,
          message: "Boletas obtenidas correctamente",
          status: Code.OK,
        });
      },
    });

    this.httpServer.register({
      method: "get",
      url: "/boletas/:id",
      auth: "jwt-empresa",
      validation: this.validation.getById,
      handler: async ({ params, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const data = await this.getBoleta.execute({ id: params.id, empresaId: auth.empresaId });
        return new ApiResponse({
          data,
          message: "Boleta obtenida correctamente",
          status: Code.OK,
        });
      },
    });
  }
}
