import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, ApiResponse, Code } from "@/shared/infra/http/api.responses";
import { ExpressAdapter } from "@/shared/infra/http/http-server";
import { RoleGroups } from "@/modules/users/domain/role-groups";
import { FrigorificoValidation } from "@/modules/frigorificos/infra/http/validation";
import { CreateFrigorifico } from "@/modules/frigorificos/use-cases/create-frigorifico.use-case";
import { ListFrigorificos } from "@/modules/frigorificos/use-cases/list-frigorificos.use-case";
import { GetFrigorifico } from "@/modules/frigorificos/use-cases/get-frigorifico.use-case";
import { UpdateFrigorifico } from "@/modules/frigorificos/use-cases/update-frigorifico.use-case";
import { DeleteFrigorifico } from "@/modules/frigorificos/use-cases/delete-frigorifico.use-case";
import { ReactivarFrigorifico } from "@/modules/frigorificos/use-cases/reactivar-frigorifico.use-case";
import {
  CreateFrigorificoInput,
  UpdateFrigorificoInput,
} from "@/modules/frigorificos/domain/frigorifico.repository";

@injectable()
export class FrigorificoController {
  constructor(
    @inject(DI_TYPES.HttpServer) private readonly httpServer: ExpressAdapter,
    @inject(DI_TYPES.FrigorificoValidation) private readonly validation: FrigorificoValidation,
    @inject(DI_TYPES.CreateFrigorifico) private readonly createFrigorifico: CreateFrigorifico,
    @inject(DI_TYPES.ListFrigorificos) private readonly listFrigorificos: ListFrigorificos,
    @inject(DI_TYPES.GetFrigorifico) private readonly getFrigorifico: GetFrigorifico,
    @inject(DI_TYPES.UpdateFrigorifico) private readonly updateFrigorifico: UpdateFrigorifico,
    @inject(DI_TYPES.DeleteFrigorifico) private readonly deleteFrigorifico: DeleteFrigorifico,
    @inject(DI_TYPES.ReactivarFrigorifico) private readonly reactivarFrigorifico: ReactivarFrigorifico,
  ) {
    this.registerRoutes();
  }

  private registerRoutes(): void {
    // Admin + contable: alta de frigoríficos es una tarea administrativa.
    this.httpServer.register({
      method: "post",
      url: "/frigorificos",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.create,
      handler: async ({ body, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const input = body as Omit<CreateFrigorificoInput, "empresaId">;
        const data = await this.createFrigorifico.execute({ ...input, empresaId: auth.empresaId });
        return new ApiResponse({
          data,
          message: "Frigorífico creado correctamente",
          status: Code.CREATED,
        });
      },
    });

    // Lectura: cualquier usuario con acceso a la empresa activa.
    this.httpServer.register({
      method: "get",
      url: "/frigorificos",
      auth: "jwt-empresa",
      validation: this.validation.list,
      handler: async ({ query, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const { estado } = query as unknown as {
          estado?: "activos" | "inactivos" | "todos";
        };
        const data = await this.listFrigorificos.execute({ empresaId: auth.empresaId, estado });
        return new ApiResponse({
          data,
          message: "Frigoríficos obtenidos correctamente",
          status: Code.OK,
        });
      },
    });

    this.httpServer.register({
      method: "get",
      url: "/frigorificos/:id",
      auth: "jwt-empresa",
      validation: this.validation.getById,
      handler: async ({ params, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const data = await this.getFrigorifico.execute({ id: params.id, empresaId: auth.empresaId });
        return new ApiResponse({
          data,
          message: "Frigorífico obtenido correctamente",
          status: Code.OK,
        });
      },
    });

    // Admin + contable: edición completa.
    this.httpServer.register({
      method: "patch",
      url: "/frigorificos/:id",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.update,
      handler: async ({ params, body, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const input = body as UpdateFrigorificoInput;
        const data = await this.updateFrigorifico.execute({
          ...input,
          id: params.id,
          empresaId: auth.empresaId,
        });
        return new ApiResponse({
          data,
          message: "Frigorífico actualizado correctamente",
          status: Code.OK,
        });
      },
    });

    // Admin + contable: soft-delete — no borra la fila, resultados de faena
    // históricos que ya lo referencian no se rompen.
    this.httpServer.register({
      method: "delete",
      url: "/frigorificos/:id",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.delete,
      handler: async ({ params, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        await this.deleteFrigorifico.execute({ id: params.id, empresaId: auth.empresaId });
        return new ApiResponse({
          message: "Frigorífico eliminado correctamente",
          status: Code.OK,
        });
      },
    });

    // Admin + contable: deshace el soft-delete.
    this.httpServer.register({
      method: "post",
      url: "/frigorificos/:id/reactivar",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.reactivar,
      handler: async ({ params, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const data = await this.reactivarFrigorifico.execute({ id: params.id, empresaId: auth.empresaId });
        return new ApiResponse({
          data,
          message: "Frigorífico reactivado correctamente",
          status: Code.OK,
        });
      },
    });
  }
}
