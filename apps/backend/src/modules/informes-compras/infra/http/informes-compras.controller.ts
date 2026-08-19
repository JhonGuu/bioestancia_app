import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, ApiResponse, Code } from "@/shared/infra/http/api.responses";
import { ExpressAdapter } from "@/shared/infra/http/http-server";
import { RoleGroups } from "@/modules/users/domain/role-groups";
import { ObtenerRentabilidadTropas } from "@/modules/informes-compras/use-cases/obtener-rentabilidad-tropas.use-case";

@injectable()
export class InformesComprasController {
  constructor(
    @inject(DI_TYPES.HttpServer) private readonly httpServer: ExpressAdapter,
    @inject(DI_TYPES.ObtenerRentabilidadTropas)
    private readonly obtenerRentabilidadTropas: ObtenerRentabilidadTropas,
  ) {
    this.registerRoutes();
  }

  private registerRoutes(): void {
    // Visibilidad de costos/rentabilidad — admin y contable (mismo grupo que cuenta corriente).
    this.httpServer.register({
      method: "get",
      url: "/compras/informes/rentabilidad",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      handler: async ({ auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const data = await this.obtenerRentabilidadTropas.execute({ empresaId: auth.empresaId });
        return new ApiResponse({ data, message: "Rentabilidad obtenida correctamente", status: Code.OK });
      },
    });
  }
}
