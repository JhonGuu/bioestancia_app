import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, ApiResponse, Code } from "@/shared/infra/http/api.responses";
import { ExpressAdapter } from "@/shared/infra/http/http-server";
import { JornadaValidation } from "@/modules/personal/infra/http/jornada.validation";
import { CalcularJornadasEmpleado } from "@/modules/personal/use-cases/jornada/calcular-jornadas-empleado.use-case";

/** Cálculo de jornada (asistencia) por empleado — ver `CalcularJornadasEmpleado`. */
@injectable()
export class JornadaController {
  constructor(
    @inject(DI_TYPES.HttpServer) private readonly httpServer: ExpressAdapter,
    @inject(DI_TYPES.JornadaValidation) private readonly validation: JornadaValidation,
    @inject(DI_TYPES.CalcularJornadasEmpleado)
    private readonly calcularJornadasEmpleado: CalcularJornadasEmpleado,
  ) {
    this.registerRoutes();
  }

  private registerRoutes(): void {
    this.httpServer.register({
      method: "get",
      url: "/personal/empleados/:id/jornadas",
      auth: "jwt-empresa",
      validation: this.validation.calcular,
      handler: async ({ params, query, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const { desde, hasta } = query as unknown as { desde: Date; hasta: Date };
        const data = await this.calcularJornadasEmpleado.execute({
          empresaId: auth.empresaId,
          empleadoId: params.id,
          desde,
          hasta,
        });
        return new ApiResponse({ data, message: "Jornadas calculadas correctamente", status: Code.OK });
      },
    });
  }
}
