import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, ApiResponse, Code } from "@/shared/infra/http/api.responses";
import { ExpressAdapter } from "@/shared/infra/http/http-server";
import { BalanceHorasValidation } from "@/modules/personal/infra/http/balance-horas.validation";
import { CalcularBalanceHoras } from "@/modules/personal/use-cases/balance-horas/calcular-balance-horas.use-case";
import { PeriodoBalance } from "@/modules/personal/domain/balance-horas";

/** Balance de horas extra por período — ver `CalcularBalanceHoras`. */
@injectable()
export class BalanceHorasController {
  constructor(
    @inject(DI_TYPES.HttpServer) private readonly httpServer: ExpressAdapter,
    @inject(DI_TYPES.BalanceHorasValidation) private readonly validation: BalanceHorasValidation,
    @inject(DI_TYPES.CalcularBalanceHoras) private readonly calcularBalanceHoras: CalcularBalanceHoras,
  ) {
    this.registerRoutes();
  }

  private registerRoutes(): void {
    this.httpServer.register({
      method: "get",
      url: "/personal/balance-horas",
      auth: "jwt-empresa",
      validation: this.validation.calcular,
      handler: async ({ query, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const { periodo, fecha } = query as unknown as { periodo: PeriodoBalance; fecha?: Date };
        const data = await this.calcularBalanceHoras.execute({
          empresaId: auth.empresaId,
          periodo,
          fechaReferencia: fecha ?? new Date(),
        });
        return new ApiResponse({ data, message: "Balance calculado correctamente", status: Code.OK });
      },
    });
  }
}
