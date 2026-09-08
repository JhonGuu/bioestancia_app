import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, ApiResponse, Code } from "@/shared/infra/http/api.responses";
import { ExpressAdapter } from "@/shared/infra/http/http-server";
import { RoleGroups } from "@/modules/users/domain/role-groups";
import { Permisos } from "@/modules/permisos/domain/permiso";
import { LiquidacionFaenaValidation } from "@/modules/liquidacion-faena/infra/http/validation";
import {
  CreateLiquidacionFaena,
  CreateLiquidacionFaenaUseCaseInput,
} from "@/modules/liquidacion-faena/use-cases/create-liquidacion-faena.use-case";
import { GetLiquidacionFaena } from "@/modules/liquidacion-faena/use-cases/get-liquidacion-faena.use-case";

@injectable()
export class LiquidacionFaenaController {
  constructor(
    @inject(DI_TYPES.HttpServer) private readonly httpServer: ExpressAdapter,
    @inject(DI_TYPES.LiquidacionFaenaValidation) private readonly validation: LiquidacionFaenaValidation,
    @inject(DI_TYPES.CreateLiquidacionFaena)
    private readonly createLiquidacionFaena: CreateLiquidacionFaena,
    @inject(DI_TYPES.GetLiquidacionFaena) private readonly getLiquidacionFaena: GetLiquidacionFaena,
  ) {
    this.registerRoutes();
  }

  private registerRoutes(): void {
    // Admin + contable: cargar lo que cobra el frigorífico es una tarea administrativa.
    this.httpServer.register({
      method: "post",
      url: "/compras/:compraId/liquidacion-faena",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.create,
      handler: async ({ params, body, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const input = body as Omit<CreateLiquidacionFaenaUseCaseInput, "empresaId" | "compraId">;
        const data = await this.createLiquidacionFaena.execute({
          ...input,
          compraId: params.compraId,
          empresaId: auth.empresaId,
        });
        return new ApiResponse({
          data,
          message: "Liquidación de faena cargada correctamente",
          status: Code.CREATED,
        });
      },
    });

    // Lectura protegida por permiso granular (VER_LIQUIDACIONES, compartido con
    // liquidación de compra — quien ve una, ve la otra).
    this.httpServer.register({
      method: "get",
      url: "/compras/:compraId/liquidacion-faena",
      auth: "jwt-empresa",
      permisos: [Permisos.VER_LIQUIDACIONES],
      validation: this.validation.getByCompra,
      handler: async ({ params, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const data = await this.getLiquidacionFaena.execute({
          compraId: params.compraId,
          empresaId: auth.empresaId,
        });
        return new ApiResponse({
          data,
          message: "Liquidación de faena obtenida correctamente",
          status: Code.OK,
        });
      },
    });
  }
}
