import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, ApiResponse, Code } from "@/shared/infra/http/api.responses";
import { ExpressAdapter } from "@/shared/infra/http/http-server";
import { RoleGroups } from "@/modules/users/domain/role-groups";
import { CobroValidation } from "@/modules/cobros/infra/http/validation";
import { CreateCobro, CreateCobroUseCaseInput } from "@/modules/cobros/use-cases/create-cobro.use-case";
import { ListCobros } from "@/modules/cobros/use-cases/list-cobros.use-case";
import { GetCobro } from "@/modules/cobros/use-cases/get-cobro.use-case";
import { SugerirRecargoCheque } from "@/modules/cobros/use-cases/sugerir-recargo-cheque.use-case";
import { ConfirmarRecargoCheque } from "@/modules/cobros/use-cases/confirmar-recargo-cheque.use-case";
import { SugerirReversionChequeRechazado } from "@/modules/cobros/use-cases/sugerir-reversion-cheque-rechazado.use-case";
import { ConfirmarRechazoCheque } from "@/modules/cobros/use-cases/confirmar-rechazo-cheque.use-case";

@injectable()
export class CobroController {
  constructor(
    @inject(DI_TYPES.HttpServer) private readonly httpServer: ExpressAdapter,
    @inject(DI_TYPES.CobroValidation) private readonly validation: CobroValidation,
    @inject(DI_TYPES.CreateCobro) private readonly createCobro: CreateCobro,
    @inject(DI_TYPES.ListCobros) private readonly listCobros: ListCobros,
    @inject(DI_TYPES.GetCobro) private readonly getCobro: GetCobro,
    @inject(DI_TYPES.SugerirRecargoCheque) private readonly sugerirRecargoCheque: SugerirRecargoCheque,
    @inject(DI_TYPES.ConfirmarRecargoCheque) private readonly confirmarRecargoCheque: ConfirmarRecargoCheque,
    @inject(DI_TYPES.SugerirReversionChequeRechazado)
    private readonly sugerirReversionChequeRechazado: SugerirReversionChequeRechazado,
    @inject(DI_TYPES.ConfirmarRechazoCheque) private readonly confirmarRechazoCheque: ConfirmarRechazoCheque,
  ) {
    this.registerRoutes();
  }

  private registerRoutes(): void {
    // Carga de cobros — admin y contable (ver RoleGroups.AdminAndContable).
    this.httpServer.register({
      method: "post",
      url: "/cobros",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.create,
      handler: async ({ body, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const input = body as Omit<CreateCobroUseCaseInput, "empresaId">;
        const data = await this.createCobro.execute({ ...input, empresaId: auth.empresaId });
        return new ApiResponse({ data, message: "Cobro creado correctamente", status: Code.CREATED });
      },
    });

    this.httpServer.register({
      method: "get",
      url: "/cobros",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.list,
      handler: async ({ query, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const { clienteId } = query as unknown as { clienteId?: string };
        const data = await this.listCobros.execute({ empresaId: auth.empresaId, clienteId });
        return new ApiResponse({ data, message: "Cobros obtenidos correctamente", status: Code.OK });
      },
    });

    this.httpServer.register({
      method: "get",
      url: "/cobros/:id",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.getById,
      handler: async ({ params, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const data = await this.getCobro.execute({ id: params.id, empresaId: auth.empresaId });
        return new ApiResponse({ data, message: "Cobro obtenido correctamente", status: Code.OK });
      },
    });

    // Recargo por cheque a más de 7 días — sugerencia (solo cálculo) + confirmación manual.
    this.httpServer.register({
      method: "get",
      url: "/cobros/cheques/:chequeId/sugerencia-recargo",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.sugerenciaRecargoCheque,
      handler: async ({ params, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const data = await this.sugerirRecargoCheque.execute({
          chequeId: params.chequeId,
          empresaId: auth.empresaId,
        });
        return new ApiResponse({ data, message: "Sugerencia calculada", status: Code.OK });
      },
    });

    this.httpServer.register({
      method: "post",
      url: "/cobros/cheques/:chequeId/confirmar-recargo",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.confirmarRecargoCheque,
      handler: async ({ params, body, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const { monto } = body as { monto?: number };
        const data = await this.confirmarRecargoCheque.execute({
          chequeId: params.chequeId,
          empresaId: auth.empresaId,
          monto,
        });
        return new ApiResponse({ data, message: "Recargo confirmado", status: Code.CREATED });
      },
    });

    // Cheque rechazado — sugerencia de reversión + comisión (solo cálculo) + confirmación manual.
    this.httpServer.register({
      method: "get",
      url: "/cobros/cheques/:chequeId/sugerencia-rechazo",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.sugerenciaRechazoCheque,
      handler: async ({ params, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const data = await this.sugerirReversionChequeRechazado.execute({
          chequeId: params.chequeId,
          empresaId: auth.empresaId,
        });
        return new ApiResponse({ data, message: "Sugerencia calculada", status: Code.OK });
      },
    });

    this.httpServer.register({
      method: "post",
      url: "/cobros/cheques/:chequeId/confirmar-rechazo",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.confirmarRechazoCheque,
      handler: async ({ params, body, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const { comision } = body as { comision?: number };
        const data = await this.confirmarRechazoCheque.execute({
          chequeId: params.chequeId,
          empresaId: auth.empresaId,
          comision,
        });
        return new ApiResponse({
          data,
          message: "Rechazo confirmado: se revirtió lo aplicado y se cargó la comisión",
          status: Code.CREATED,
        });
      },
    });
  }
}
