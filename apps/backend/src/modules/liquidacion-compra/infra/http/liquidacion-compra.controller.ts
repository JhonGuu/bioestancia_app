import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, ApiResponse, Code } from "@/shared/infra/http/api.responses";
import { ExpressAdapter } from "@/shared/infra/http/http-server";
import { RoleGroups } from "@/modules/users/domain/role-groups";
import { LiquidacionCompraValidation } from "@/modules/liquidacion-compra/infra/http/validation";
import {
  CreateLiquidacionCompra,
  CreateLiquidacionCompraUseCaseInput,
} from "@/modules/liquidacion-compra/use-cases/create-liquidacion-compra.use-case";
import { GetLiquidacionCompra } from "@/modules/liquidacion-compra/use-cases/get-liquidacion-compra.use-case";
import { EmitirCaeLiquidacionCompra } from "@/modules/liquidacion-compra/use-cases/emitir-cae-liquidacion-compra.use-case";

@injectable()
export class LiquidacionCompraController {
  constructor(
    @inject(DI_TYPES.HttpServer) private readonly httpServer: ExpressAdapter,
    @inject(DI_TYPES.LiquidacionCompraValidation) private readonly validation: LiquidacionCompraValidation,
    @inject(DI_TYPES.CreateLiquidacionCompra)
    private readonly createLiquidacionCompra: CreateLiquidacionCompra,
    @inject(DI_TYPES.GetLiquidacionCompra) private readonly getLiquidacionCompra: GetLiquidacionCompra,
    @inject(DI_TYPES.EmitirCaeLiquidacionCompra)
    private readonly emitirCaeLiquidacionCompra: EmitirCaeLiquidacionCompra,
  ) {
    this.registerRoutes();
  }

  private registerRoutes(): void {
    // Admin + contable: emitir la liquidación es una tarea administrativa/fiscal.
    this.httpServer.register({
      method: "post",
      url: "/compras/:compraId/liquidacion",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.create,
      handler: async ({ params, body, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const input = body as Omit<CreateLiquidacionCompraUseCaseInput, "empresaId" | "compraId">;
        const data = await this.createLiquidacionCompra.execute({
          ...input,
          compraId: params.compraId,
          empresaId: auth.empresaId,
        });
        return new ApiResponse({
          data,
          message: "Liquidación de compra creada correctamente",
          status: Code.CREATED,
        });
      },
    });

    // Lectura: cualquier usuario con acceso a la empresa activa.
    this.httpServer.register({
      method: "get",
      url: "/compras/:compraId/liquidacion",
      auth: "jwt-empresa",
      validation: this.validation.getByCompra,
      handler: async ({ params, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const data = await this.getLiquidacionCompra.execute({
          compraId: params.compraId,
          empresaId: auth.empresaId,
        });
        return new ApiResponse({
          data,
          message: "Liquidación de compra obtenida correctamente",
          status: Code.OK,
        });
      },
    });

    // Le pide el CAE a AFIP (WSLSP) para la liquidación ya cargada. Misma
    // franja de roles que crearla — es un trámite fiscal, no una consulta.
    this.httpServer.register({
      method: "post",
      url: "/compras/:compraId/liquidacion/emitir-cae",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.getByCompra,
      handler: async ({ params, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const data = await this.emitirCaeLiquidacionCompra.execute({
          compraId: params.compraId,
          empresaId: auth.empresaId,
        });
        return new ApiResponse({
          data,
          message: "CAE emitido correctamente",
          status: Code.OK,
        });
      },
    });
  }
}
