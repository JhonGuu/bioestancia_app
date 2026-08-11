import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, ApiResponse, Code } from "@/shared/infra/http/api.responses";
import { ExpressAdapter } from "@/shared/infra/http/http-server";
import { RoleGroups } from "@/modules/users/domain/role-groups";
import { ProveedorValidation } from "@/modules/proveedores/infra/http/validation";
import { CreateProveedor } from "@/modules/proveedores/use-cases/create-proveedor.use-case";
import { ListProveedores } from "@/modules/proveedores/use-cases/list-proveedores.use-case";
import { GetProveedor } from "@/modules/proveedores/use-cases/get-proveedor.use-case";
import { UpdateProveedor } from "@/modules/proveedores/use-cases/update-proveedor.use-case";
import { DeleteProveedor } from "@/modules/proveedores/use-cases/delete-proveedor.use-case";
import { ReactivarProveedor } from "@/modules/proveedores/use-cases/reactivar-proveedor.use-case";
import {
  CreateProveedorInput,
  UpdateProveedorInput,
} from "@/modules/proveedores/domain/proveedor.repository";

@injectable()
export class ProveedorController {
  constructor(
    @inject(DI_TYPES.HttpServer) private readonly httpServer: ExpressAdapter,
    @inject(DI_TYPES.ProveedorValidation) private readonly validation: ProveedorValidation,
    @inject(DI_TYPES.CreateProveedor) private readonly createProveedor: CreateProveedor,
    @inject(DI_TYPES.ListProveedores) private readonly listProveedores: ListProveedores,
    @inject(DI_TYPES.GetProveedor) private readonly getProveedor: GetProveedor,
    @inject(DI_TYPES.UpdateProveedor) private readonly updateProveedor: UpdateProveedor,
    @inject(DI_TYPES.DeleteProveedor) private readonly deleteProveedor: DeleteProveedor,
    @inject(DI_TYPES.ReactivarProveedor) private readonly reactivarProveedor: ReactivarProveedor,
  ) {
    this.registerRoutes();
  }

  private registerRoutes(): void {
    // Admin + contable: alta de proveedores es una tarea comercial/administrativa.
    this.httpServer.register({
      method: "post",
      url: "/proveedores",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.create,
      handler: async ({ body, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const input = body as Omit<CreateProveedorInput, "empresaId">;
        const data = await this.createProveedor.execute({ ...input, empresaId: auth.empresaId });
        return new ApiResponse({
          data,
          message: "Proveedor creado correctamente",
          status: Code.CREATED,
        });
      },
    });

    // Lectura: cualquier usuario con acceso a la empresa activa. `estado`
    // (query) filtra activos/inactivos/todos — default "activos", mismo
    // criterio que usan los selectores de compras/boletas.
    this.httpServer.register({
      method: "get",
      url: "/proveedores",
      auth: "jwt-empresa",
      validation: this.validation.list,
      handler: async ({ query, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const { estado } = query as unknown as {
          estado?: "activos" | "inactivos" | "todos";
        };
        const data = await this.listProveedores.execute({ empresaId: auth.empresaId, estado });
        return new ApiResponse({
          data,
          message: "Proveedores obtenidos correctamente",
          status: Code.OK,
        });
      },
    });

    this.httpServer.register({
      method: "get",
      url: "/proveedores/:id",
      auth: "jwt-empresa",
      validation: this.validation.getById,
      handler: async ({ params, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const data = await this.getProveedor.execute({ id: params.id, empresaId: auth.empresaId });
        return new ApiResponse({
          data,
          message: "Proveedor obtenido correctamente",
          status: Code.OK,
        });
      },
    });

    // Admin + contable: edición completa (reemplaza todos los campos, misma
    // regla de negocio que el alta — ver `ProveedorValidation.update`).
    this.httpServer.register({
      method: "patch",
      url: "/proveedores/:id",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.update,
      handler: async ({ params, body, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const input = body as UpdateProveedorInput;
        const data = await this.updateProveedor.execute({
          ...input,
          id: params.id,
          empresaId: auth.empresaId,
        });
        return new ApiResponse({
          data,
          message: "Proveedor actualizado correctamente",
          status: Code.OK,
        });
      },
    });

    // Admin + contable: soft-delete (ver `ProveedorRepository.delete`) —
    // nunca borra la fila, así no rompe compras históricas que ya lo referencian.
    this.httpServer.register({
      method: "delete",
      url: "/proveedores/:id",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.delete,
      handler: async ({ params, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        await this.deleteProveedor.execute({ id: params.id, empresaId: auth.empresaId });
        return new ApiResponse({
          message: "Proveedor eliminado correctamente",
          status: Code.OK,
        });
      },
    });

    // Admin + contable: deshace el soft-delete (ver `ProveedorRepository.reactivar`).
    this.httpServer.register({
      method: "post",
      url: "/proveedores/:id/reactivar",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.reactivar,
      handler: async ({ params, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const data = await this.reactivarProveedor.execute({ id: params.id, empresaId: auth.empresaId });
        return new ApiResponse({
          data,
          message: "Proveedor reactivado correctamente",
          status: Code.OK,
        });
      },
    });
  }
}
