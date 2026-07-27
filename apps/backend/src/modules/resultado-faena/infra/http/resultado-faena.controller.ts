import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, ApiResponse, Code } from "@/shared/infra/http/api.responses";
import { ExpressAdapter } from "@/shared/infra/http/http-server";
import { RoleGroups } from "@/modules/users/domain/role-groups";
import { ResultadoFaenaValidation } from "@/modules/resultado-faena/infra/http/validation";
import {
  CreateResultadoFaena,
  CreateResultadoFaenaUseCaseInput,
} from "@/modules/resultado-faena/use-cases/create-resultado-faena.use-case";
import { GetResultadoFaena } from "@/modules/resultado-faena/use-cases/get-resultado-faena.use-case";

@injectable()
export class ResultadoFaenaController {
  constructor(
    @inject(DI_TYPES.HttpServer) private readonly httpServer: ExpressAdapter,
    @inject(DI_TYPES.ResultadoFaenaValidation) private readonly validation: ResultadoFaenaValidation,
    @inject(DI_TYPES.CreateResultadoFaena) private readonly createResultadoFaena: CreateResultadoFaena,
    @inject(DI_TYPES.GetResultadoFaena) private readonly getResultadoFaena: GetResultadoFaena,
  ) {
    this.registerRoutes();
  }

  private registerRoutes(): void {
    // Admin + contable: cargar el resultado de faena es una tarea administrativa.
    this.httpServer.register({
      method: "post",
      url: "/compras/:compraId/resultado-faena",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.create,
      handler: async ({ params, body, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const input = body as Omit<CreateResultadoFaenaUseCaseInput, "empresaId" | "compraId">;
        const data = await this.createResultadoFaena.execute({
          ...input,
          compraId: params.compraId,
          empresaId: auth.empresaId,
        });
        return new ApiResponse({
          data,
          message: "Resultado de faena cargado correctamente",
          status: Code.CREATED,
        });
      },
    });

    // Lectura: cualquier usuario con acceso a la empresa activa.
    this.httpServer.register({
      method: "get",
      url: "/compras/:compraId/resultado-faena",
      auth: "jwt-empresa",
      validation: this.validation.getByCompra,
      handler: async ({ params, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const data = await this.getResultadoFaena.execute({
          compraId: params.compraId,
          empresaId: auth.empresaId,
        });
        return new ApiResponse({
          data,
          message: "Resultado de faena obtenido correctamente",
          status: Code.OK,
        });
      },
    });
  }
}
