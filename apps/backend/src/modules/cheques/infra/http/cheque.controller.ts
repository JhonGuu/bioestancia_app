import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, ApiResponse, Code } from "@/shared/infra/http/api.responses";
import { ExpressAdapter } from "@/shared/infra/http/http-server";
import { RoleGroups } from "@/modules/users/domain/role-groups";
import { ChequeValidation } from "@/modules/cheques/infra/http/validation";
import { ListCheques } from "@/modules/cheques/use-cases/list-cheques.use-case";
import { GetCheque } from "@/modules/cheques/use-cases/get-cheque.use-case";
import { ActualizarEstadoCheque } from "@/modules/cheques/use-cases/actualizar-estado-cheque.use-case";
import { EstadoCheque } from "@/modules/cheques/domain/estado-cheque";

@injectable()
export class ChequeController {
  constructor(
    @inject(DI_TYPES.HttpServer) private readonly httpServer: ExpressAdapter,
    @inject(DI_TYPES.ChequeValidation) private readonly validation: ChequeValidation,
    @inject(DI_TYPES.ListCheques) private readonly listCheques: ListCheques,
    @inject(DI_TYPES.GetCheque) private readonly getCheque: GetCheque,
    @inject(DI_TYPES.ActualizarEstadoCheque) private readonly actualizarEstadoCheque: ActualizarEstadoCheque,
  ) {
    this.registerRoutes();
  }

  private registerRoutes(): void {
    // Cartera de cheques — admin/contable (mismo grupo que cobros/cuenta corriente).
    this.httpServer.register({
      method: "get",
      url: "/cheques",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.list,
      handler: async ({ query, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const { estado, clienteId } = query as unknown as { estado?: EstadoCheque; clienteId?: string };
        const data = await this.listCheques.execute({
          empresaId: auth.empresaId,
          filtro: { estado, clienteId },
        });
        return new ApiResponse({ data, message: "Cheques obtenidos correctamente", status: Code.OK });
      },
    });

    this.httpServer.register({
      method: "get",
      url: "/cheques/:id",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.getById,
      handler: async ({ params, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const data = await this.getCheque.execute({ id: params.id, empresaId: auth.empresaId });
        return new ApiResponse({ data, message: "Cheque obtenido correctamente", status: Code.OK });
      },
    });

    this.httpServer.register({
      method: "patch",
      url: "/cheques/:id/estado",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.actualizarEstado,
      handler: async ({ params, body, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const { estado, motivoRechazo, endosadoA, fechaEndoso } = body as {
          estado: EstadoCheque;
          motivoRechazo?: string;
          endosadoA?: string;
          fechaEndoso?: Date;
        };
        const data = await this.actualizarEstadoCheque.execute({
          id: params.id,
          empresaId: auth.empresaId,
          estado,
          motivoRechazo,
          endosadoA,
          fechaEndoso,
        });
        return new ApiResponse({ data, message: "Estado del cheque actualizado", status: Code.OK });
      },
    });
  }
}
