import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, ApiResponse, Code } from "@/shared/infra/http/api.responses";
import { ExpressAdapter } from "@/shared/infra/http/http-server";
import { RoleGroups } from "@/modules/users/domain/role-groups";
import { MetasSemanalesValidation } from "@/modules/metas-semanales/infra/http/validation";
import { ObtenerProgresoMetasSemanales } from "@/modules/metas-semanales/use-cases/obtener-progreso-metas-semanales.use-case";

@injectable()
export class MetasSemanalesController {
  constructor(
    @inject(DI_TYPES.HttpServer) private readonly httpServer: ExpressAdapter,
    @inject(DI_TYPES.MetasSemanalesValidation) private readonly validation: MetasSemanalesValidation,
    @inject(DI_TYPES.ObtenerProgresoMetasSemanales)
    private readonly obtenerProgresoMetasSemanales: ObtenerProgresoMetasSemanales,
  ) {
    this.registerRoutes();
  }

  private registerRoutes(): void {
    this.httpServer.register({
      method: "get",
      url: "/metas-semanales/progreso",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.progreso,
      handler: async ({ query, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const { fecha } = query as unknown as { fecha?: Date };
        const data = await this.obtenerProgresoMetasSemanales.execute({ empresaId: auth.empresaId, fecha });
        return new ApiResponse({ data, message: "Progreso obtenido correctamente", status: Code.OK });
      },
    });
  }
}
