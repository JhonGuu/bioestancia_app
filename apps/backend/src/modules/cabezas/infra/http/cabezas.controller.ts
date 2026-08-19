import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, ApiResponse, Code } from "@/shared/infra/http/api.responses";
import { ExpressAdapter } from "@/shared/infra/http/http-server";
import { RoleGroups } from "@/modules/users/domain/role-groups";
import { CabezasValidation, semanaPorDefecto } from "@/modules/cabezas/infra/http/validation";
import { ObtenerInformeCabezas } from "@/modules/cabezas/use-cases/obtener-informe-cabezas.use-case";

interface FiltrosQuery {
  anio?: number;
  semana?: number;
}

@injectable()
export class CabezasController {
  constructor(
    @inject(DI_TYPES.HttpServer) private readonly httpServer: ExpressAdapter,
    @inject(DI_TYPES.CabezasValidation) private readonly validation: CabezasValidation,
    @inject(DI_TYPES.ObtenerInformeCabezas) private readonly obtenerInformeCabezas: ObtenerInformeCabezas,
  ) {
    this.registerRoutes();
  }

  private registerRoutes(): void {
    // Visibilidad — mismo grupo que `planificacion-cabezas`: admin y contable.
    this.httpServer.register({
      method: "get",
      url: "/cabezas",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.get,
      handler: async ({ query, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const { anio, semana } = query as unknown as FiltrosQuery;
        const defecto = semanaPorDefecto();
        const data = await this.obtenerInformeCabezas.execute({
          empresaId: auth.empresaId,
          anio: anio ?? defecto.anio,
          semana: semana ?? defecto.semana,
        });
        return new ApiResponse({ data, message: "Informe de cabezas obtenido correctamente", status: Code.OK });
      },
    });
  }
}
