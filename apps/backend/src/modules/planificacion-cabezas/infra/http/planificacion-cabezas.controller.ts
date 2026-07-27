import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, ApiResponse, Code } from "@/shared/infra/http/api.responses";
import { ExpressAdapter } from "@/shared/infra/http/http-server";
import { RoleGroups } from "@/modules/users/domain/role-groups";
import { PlanificacionCabezasValidation } from "@/modules/planificacion-cabezas/infra/http/validation";
import {
  UpsertPlanificacionCabezas,
  UpsertPlanificacionCabezasUseCaseInput,
} from "@/modules/planificacion-cabezas/use-cases/upsert-planificacion-cabezas.use-case";
import { ListPlanificacionCabezas } from "@/modules/planificacion-cabezas/use-cases/list-planificacion-cabezas.use-case";

interface ListPlanificacionCabezasQuery {
  desde: Date;
  hasta: Date;
  clienteId?: string;
}

@injectable()
export class PlanificacionCabezasController {
  constructor(
    @inject(DI_TYPES.HttpServer) private readonly httpServer: ExpressAdapter,
    @inject(DI_TYPES.PlanificacionCabezasValidation)
    private readonly validation: PlanificacionCabezasValidation,
    @inject(DI_TYPES.UpsertPlanificacionCabezas)
    private readonly upsertPlanificacionCabezas: UpsertPlanificacionCabezas,
    @inject(DI_TYPES.ListPlanificacionCabezas)
    private readonly listPlanificacionCabezas: ListPlanificacionCabezas,
  ) {
    this.registerRoutes();
  }

  private registerRoutes(): void {
    // Admin + contable: planificar es una tarea comercial/administrativa.
    this.httpServer.register({
      method: "post",
      url: "/planificacion-cabezas",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.upsert,
      handler: async ({ body, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const input = body as Omit<UpsertPlanificacionCabezasUseCaseInput, "empresaId">;
        const data = await this.upsertPlanificacionCabezas.execute({
          ...input,
          empresaId: auth.empresaId,
        });
        return new ApiResponse({
          data,
          message: "Planificación de cabezas guardada correctamente",
          status: Code.CREATED,
        });
      },
    });

    // Lectura: cualquier usuario con acceso a la empresa activa.
    this.httpServer.register({
      method: "get",
      url: "/planificacion-cabezas",
      auth: "jwt-empresa",
      validation: this.validation.list,
      handler: async ({ query, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const filtro = query as unknown as ListPlanificacionCabezasQuery;
        const data = await this.listPlanificacionCabezas.execute({
          empresaId: auth.empresaId,
          desde: filtro.desde,
          hasta: filtro.hasta,
          clienteId: filtro.clienteId,
        });
        return new ApiResponse({
          data,
          message: "Planificación de cabezas obtenida correctamente",
          status: Code.OK,
        });
      },
    });
  }
}
