import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, ApiResponse, Code } from "@/shared/infra/http/api.responses";
import { ExpressAdapter } from "@/shared/infra/http/http-server";
import { RoleGroups } from "@/modules/users/domain/role-groups";
import { CargoValidation } from "@/modules/personal/infra/http/cargo.validation";
import { CreateCargo } from "@/modules/personal/use-cases/cargo/create-cargo.use-case";
import { ListCargos } from "@/modules/personal/use-cases/cargo/list-cargos.use-case";
import { GetCargo } from "@/modules/personal/use-cases/cargo/get-cargo.use-case";
import { UpdateCargo } from "@/modules/personal/use-cases/cargo/update-cargo.use-case";
import { DeleteCargo } from "@/modules/personal/use-cases/cargo/delete-cargo.use-case";
import { ReactivarCargo } from "@/modules/personal/use-cases/cargo/reactivar-cargo.use-case";
import { CreateCargoInput, UpdateCargoInput } from "@/modules/personal/domain/cargo.repository";

/** CRUD de Cargos (puestos) — mismo patrón que `FrigorificoController`. */
@injectable()
export class CargoController {
  constructor(
    @inject(DI_TYPES.HttpServer) private readonly httpServer: ExpressAdapter,
    @inject(DI_TYPES.CargoValidation) private readonly validation: CargoValidation,
    @inject(DI_TYPES.CreateCargo) private readonly createCargo: CreateCargo,
    @inject(DI_TYPES.ListCargos) private readonly listCargos: ListCargos,
    @inject(DI_TYPES.GetCargo) private readonly getCargo: GetCargo,
    @inject(DI_TYPES.UpdateCargo) private readonly updateCargo: UpdateCargo,
    @inject(DI_TYPES.DeleteCargo) private readonly deleteCargo: DeleteCargo,
    @inject(DI_TYPES.ReactivarCargo) private readonly reactivarCargo: ReactivarCargo,
  ) {
    this.registerRoutes();
  }

  private registerRoutes(): void {
    this.httpServer.register({
      method: "post",
      url: "/personal/cargos",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.create,
      handler: async ({ body, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const input = body as Omit<CreateCargoInput, "empresaId">;
        const data = await this.createCargo.execute({ ...input, empresaId: auth.empresaId });
        return new ApiResponse({ data, message: "Cargo creado correctamente", status: Code.CREATED });
      },
    });

    this.httpServer.register({
      method: "get",
      url: "/personal/cargos",
      auth: "jwt-empresa",
      validation: this.validation.list,
      handler: async ({ query, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const { estado } = query as unknown as { estado?: "activos" | "inactivos" | "todos" };
        const data = await this.listCargos.execute({ empresaId: auth.empresaId, estado });
        return new ApiResponse({ data, message: "Cargos obtenidos correctamente", status: Code.OK });
      },
    });

    this.httpServer.register({
      method: "get",
      url: "/personal/cargos/:id",
      auth: "jwt-empresa",
      validation: this.validation.getById,
      handler: async ({ params, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const data = await this.getCargo.execute({ id: params.id, empresaId: auth.empresaId });
        return new ApiResponse({ data, message: "Cargo obtenido correctamente", status: Code.OK });
      },
    });

    this.httpServer.register({
      method: "patch",
      url: "/personal/cargos/:id",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.update,
      handler: async ({ params, body, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const input = body as UpdateCargoInput;
        const data = await this.updateCargo.execute({ ...input, id: params.id, empresaId: auth.empresaId });
        return new ApiResponse({ data, message: "Cargo actualizado correctamente", status: Code.OK });
      },
    });

    this.httpServer.register({
      method: "delete",
      url: "/personal/cargos/:id",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.delete,
      handler: async ({ params, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        await this.deleteCargo.execute({ id: params.id, empresaId: auth.empresaId });
        return new ApiResponse({ message: "Cargo eliminado correctamente", status: Code.OK });
      },
    });

    this.httpServer.register({
      method: "post",
      url: "/personal/cargos/:id/reactivar",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.reactivar,
      handler: async ({ params, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const data = await this.reactivarCargo.execute({ id: params.id, empresaId: auth.empresaId });
        return new ApiResponse({ data, message: "Cargo reactivado correctamente", status: Code.OK });
      },
    });
  }
}
