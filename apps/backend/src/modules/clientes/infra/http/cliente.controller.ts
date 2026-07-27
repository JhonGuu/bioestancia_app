import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, ApiResponse, Code } from "@/shared/infra/http/api.responses";
import { ExpressAdapter } from "@/shared/infra/http/http-server";
import { RoleGroups } from "@/modules/users/domain/role-groups";
import { ClienteValidation } from "@/modules/clientes/infra/http/validation";
import { CreateCliente } from "@/modules/clientes/use-cases/create-cliente.use-case";
import { ListClientes } from "@/modules/clientes/use-cases/list-clientes.use-case";
import { GetCliente } from "@/modules/clientes/use-cases/get-cliente.use-case";
import { CreateClienteInput } from "@/modules/clientes/domain/cliente.repository";

@injectable()
export class ClienteController {
  constructor(
    @inject(DI_TYPES.HttpServer) private readonly httpServer: ExpressAdapter,
    @inject(DI_TYPES.ClienteValidation) private readonly validation: ClienteValidation,
    @inject(DI_TYPES.CreateCliente) private readonly createCliente: CreateCliente,
    @inject(DI_TYPES.ListClientes) private readonly listClientes: ListClientes,
    @inject(DI_TYPES.GetCliente) private readonly getCliente: GetCliente,
  ) {
    this.registerRoutes();
  }

  private registerRoutes(): void {
    // Admin + contable: alta de clientes es una tarea comercial/administrativa.
    this.httpServer.register({
      method: "post",
      url: "/clientes",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.create,
      handler: async ({ body, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const input = body as Omit<CreateClienteInput, "empresaId">;
        const data = await this.createCliente.execute({ ...input, empresaId: auth.empresaId });
        return new ApiResponse({
          data,
          message: "Cliente creado correctamente",
          status: Code.CREATED,
        });
      },
    });

    // Lectura: cualquier usuario con acceso a la empresa activa.
    this.httpServer.register({
      method: "get",
      url: "/clientes",
      auth: "jwt-empresa",
      handler: async ({ auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const data = await this.listClientes.execute({ empresaId: auth.empresaId });
        return new ApiResponse({
          data,
          message: "Clientes obtenidos correctamente",
          status: Code.OK,
        });
      },
    });

    this.httpServer.register({
      method: "get",
      url: "/clientes/:id",
      auth: "jwt-empresa",
      validation: this.validation.getById,
      handler: async ({ params, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const data = await this.getCliente.execute({ id: params.id, empresaId: auth.empresaId });
        return new ApiResponse({
          data,
          message: "Cliente obtenido correctamente",
          status: Code.OK,
        });
      },
    });
  }
}
