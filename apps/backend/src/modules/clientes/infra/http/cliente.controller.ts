import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, ApiResponse, Code } from "@/shared/infra/http/api.responses";
import { ExpressAdapter } from "@/shared/infra/http/http-server";
import { RoleGroups } from "@/modules/users/domain/role-groups";
import { ClienteValidation } from "@/modules/clientes/infra/http/validation";
import { CreateCliente } from "@/modules/clientes/use-cases/create-cliente.use-case";
import { ListClientes } from "@/modules/clientes/use-cases/list-clientes.use-case";
import { GetCliente } from "@/modules/clientes/use-cases/get-cliente.use-case";
import { UpdateCliente } from "@/modules/clientes/use-cases/update-cliente.use-case";
import { DeleteCliente } from "@/modules/clientes/use-cases/delete-cliente.use-case";
import { CreateClienteFinal } from "@/modules/clientes/use-cases/create-cliente-final.use-case";
import { ListClientesFinales } from "@/modules/clientes/use-cases/list-clientes-finales.use-case";
import { CreateClienteInput, UpdateClienteInput } from "@/modules/clientes/domain/cliente.repository";

@injectable()
export class ClienteController {
  constructor(
    @inject(DI_TYPES.HttpServer) private readonly httpServer: ExpressAdapter,
    @inject(DI_TYPES.ClienteValidation) private readonly validation: ClienteValidation,
    @inject(DI_TYPES.CreateCliente) private readonly createCliente: CreateCliente,
    @inject(DI_TYPES.ListClientes) private readonly listClientes: ListClientes,
    @inject(DI_TYPES.GetCliente) private readonly getCliente: GetCliente,
    @inject(DI_TYPES.UpdateCliente) private readonly updateCliente: UpdateCliente,
    @inject(DI_TYPES.DeleteCliente) private readonly deleteCliente: DeleteCliente,
    @inject(DI_TYPES.CreateClienteFinal) private readonly createClienteFinal: CreateClienteFinal,
    @inject(DI_TYPES.ListClientesFinales) private readonly listClientesFinales: ListClientesFinales,
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

    // Admin + contable: edición completa (reemplaza todos los campos, misma
    // regla de negocio que el alta — ver `ClienteValidation.update`).
    this.httpServer.register({
      method: "patch",
      url: "/clientes/:id",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.update,
      handler: async ({ params, body, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const input = body as UpdateClienteInput;
        const data = await this.updateCliente.execute({
          ...input,
          id: params.id,
          empresaId: auth.empresaId,
        });
        return new ApiResponse({
          data,
          message: "Cliente actualizado correctamente",
          status: Code.OK,
        });
      },
    });

    // Admin + contable: soft-delete (ver `ClienteRepository.delete`) — nunca
    // borra la fila, así no rompe ventas/boletas históricas que ya lo referencian.
    this.httpServer.register({
      method: "delete",
      url: "/clientes/:id",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.delete,
      handler: async ({ params, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        await this.deleteCliente.execute({ id: params.id, empresaId: auth.empresaId });
        return new ApiResponse({
          message: "Cliente eliminado correctamente",
          status: Code.OK,
        });
      },
    });

    // Destinos de reventa (ver `esRevendedor` en el dominio) — quien carga
    // boletas también puede dar de alta un destino nuevo al vuelo (ej. el
    // operario, si Ivan reparte a un local que todavía no está en la lista).
    this.httpServer.register({
      method: "post",
      url: "/clientes/:clienteId/clientes-finales",
      auth: "jwt-empresa",
      roles: RoleGroups.BoletaLoaders,
      validation: this.validation.createClienteFinal,
      handler: async ({ params, body, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const { nombre } = body as { nombre: string };
        const data = await this.createClienteFinal.execute({
          clienteId: params.clienteId,
          empresaId: auth.empresaId,
          nombre,
        });
        return new ApiResponse({
          data,
          message: "Destino creado correctamente",
          status: Code.CREATED,
        });
      },
    });

    this.httpServer.register({
      method: "get",
      url: "/clientes/:clienteId/clientes-finales",
      auth: "jwt-empresa",
      validation: this.validation.listClientesFinales,
      handler: async ({ params, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const data = await this.listClientesFinales.execute({
          clienteId: params.clienteId,
          empresaId: auth.empresaId,
        });
        return new ApiResponse({
          data,
          message: "Destinos obtenidos correctamente",
          status: Code.OK,
        });
      },
    });
  }
}
