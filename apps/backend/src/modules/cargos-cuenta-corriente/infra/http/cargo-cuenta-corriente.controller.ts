import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, ApiResponse, Code } from "@/shared/infra/http/api.responses";
import { ExpressAdapter } from "@/shared/infra/http/http-server";
import { RoleGroups } from "@/modules/users/domain/role-groups";
import { CargoCuentaCorrienteValidation } from "@/modules/cargos-cuenta-corriente/infra/http/validation";
import {
  CreateCargoCuentaCorriente,
  CreateCargoCuentaCorrienteUseCaseInput,
} from "@/modules/cargos-cuenta-corriente/use-cases/create-cargo-cuenta-corriente.use-case";
import { ListCargosCuentaCorriente } from "@/modules/cargos-cuenta-corriente/use-cases/list-cargos-cuenta-corriente.use-case";

@injectable()
export class CargoCuentaCorrienteController {
  constructor(
    @inject(DI_TYPES.HttpServer) private readonly httpServer: ExpressAdapter,
    @inject(DI_TYPES.CargoCuentaCorrienteValidation) private readonly validation: CargoCuentaCorrienteValidation,
    @inject(DI_TYPES.CreateCargoCuentaCorriente) private readonly createCargoCuentaCorriente: CreateCargoCuentaCorriente,
    @inject(DI_TYPES.ListCargosCuentaCorriente) private readonly listCargosCuentaCorriente: ListCargosCuentaCorriente,
  ) {
    this.registerRoutes();
  }

  private registerRoutes(): void {
    // Cargo manual (tipo "otro") — admin/contable. Los de recargo/comisión
    // por cheque se confirman desde /cobros/cheques/:chequeId/... (ver
    // cobro.controller.ts), no desde acá.
    this.httpServer.register({
      method: "post",
      url: "/cargos-cuenta-corriente",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.create,
      handler: async ({ body, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const input = body as Omit<CreateCargoCuentaCorrienteUseCaseInput, "empresaId">;
        const data = await this.createCargoCuentaCorriente.execute({ ...input, empresaId: auth.empresaId });
        return new ApiResponse({ data, message: "Cargo creado correctamente", status: Code.CREATED });
      },
    });

    this.httpServer.register({
      method: "get",
      url: "/cargos-cuenta-corriente",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.list,
      handler: async ({ query, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const { clienteId } = query as unknown as { clienteId?: string };
        const data = await this.listCargosCuentaCorriente.execute({ empresaId: auth.empresaId, clienteId });
        return new ApiResponse({ data, message: "Cargos obtenidos correctamente", status: Code.OK });
      },
    });
  }
}
