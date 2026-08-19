import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, ApiResponse, Code } from "@/shared/infra/http/api.responses";
import { ExpressAdapter } from "@/shared/infra/http/http-server";
import { RoleGroups } from "@/modules/users/domain/role-groups";
import { PorcentajeCobranzaValidation } from "@/modules/porcentaje-cobranza/infra/http/validation";
import { ObtenerPorcentajeCobranza } from "@/modules/porcentaje-cobranza/use-cases/obtener-porcentaje-cobranza.use-case";

@injectable()
export class PorcentajeCobranzaController {
  constructor(
    @inject(DI_TYPES.HttpServer) private readonly httpServer: ExpressAdapter,
    @inject(DI_TYPES.PorcentajeCobranzaValidation) private readonly validation: PorcentajeCobranzaValidation,
    @inject(DI_TYPES.ObtenerPorcentajeCobranza) private readonly obtenerPorcentajeCobranza: ObtenerPorcentajeCobranza,
  ) {
    this.registerRoutes();
  }

  private registerRoutes(): void {
    this.httpServer.register({
      method: "get",
      url: "/porcentaje-cobranza",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.porcentaje,
      handler: async ({ query, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const { anio } = query as unknown as { anio: number };
        const data = await this.obtenerPorcentajeCobranza.execute({ empresaId: auth.empresaId, anio });
        return new ApiResponse({ data, message: "Porcentaje de cobranza obtenido correctamente", status: Code.OK });
      },
    });
  }
}
