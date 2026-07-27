import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, ApiResponse, Code } from "@/shared/infra/http/api.responses";
import { ExpressAdapter } from "@/shared/infra/http/http-server";
import { RoleGroups } from "@/modules/users/domain/role-groups";
import { ListaDePreciosValidation } from "@/modules/listas-precios/infra/http/validation";
import {
  CreateListaDePrecios,
  CreateListaDePreciosInput,
} from "@/modules/listas-precios/use-cases/create-lista-de-precios.use-case";
import { ListListasDePrecios } from "@/modules/listas-precios/use-cases/list-listas-de-precios.use-case";
import { GetListaDePrecios } from "@/modules/listas-precios/use-cases/get-lista-de-precios.use-case";

@injectable()
export class ListaDePreciosController {
  constructor(
    @inject(DI_TYPES.HttpServer) private readonly httpServer: ExpressAdapter,
    @inject(DI_TYPES.ListaDePreciosValidation) private readonly validation: ListaDePreciosValidation,
    @inject(DI_TYPES.CreateListaDePrecios) private readonly createListaDePrecios: CreateListaDePrecios,
    @inject(DI_TYPES.ListListasDePrecios) private readonly listListasDePrecios: ListListasDePrecios,
    @inject(DI_TYPES.GetListaDePrecios) private readonly getListaDePrecios: GetListaDePrecios,
  ) {
    this.registerRoutes();
  }

  private registerRoutes(): void {
    // Admin + contable: son quienes definen precios comerciales.
    this.httpServer.register({
      method: "post",
      url: "/listas-precios",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.create,
      handler: async ({ body, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const input = body as Omit<CreateListaDePreciosInput, "empresaId">;
        const data = await this.createListaDePrecios.execute({ ...input, empresaId: auth.empresaId });
        return new ApiResponse({
          data,
          message: "Lista de precios creada correctamente",
          status: Code.CREATED,
        });
      },
    });

    // Lectura: cualquier usuario con acceso a la empresa activa (lo va a necesitar
    // el módulo de ventas más adelante, no solo admin/contable).
    this.httpServer.register({
      method: "get",
      url: "/listas-precios",
      auth: "jwt-empresa",
      handler: async ({ auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const data = await this.listListasDePrecios.execute({ empresaId: auth.empresaId });
        return new ApiResponse({
          data,
          message: "Listas de precios obtenidas correctamente",
          status: Code.OK,
        });
      },
    });

    this.httpServer.register({
      method: "get",
      url: "/listas-precios/:id",
      auth: "jwt-empresa",
      validation: this.validation.getById,
      handler: async ({ params, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const data = await this.getListaDePrecios.execute({ id: params.id, empresaId: auth.empresaId });
        return new ApiResponse({
          data,
          message: "Lista de precios obtenida correctamente",
          status: Code.OK,
        });
      },
    });
  }
}
