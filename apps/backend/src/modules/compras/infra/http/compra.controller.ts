import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, ApiResponse, Code } from "@/shared/infra/http/api.responses";
import { ExpressAdapter } from "@/shared/infra/http/http-server";
import { RoleGroups } from "@/modules/users/domain/role-groups";
import { CompraValidation } from "@/modules/compras/infra/http/validation";
import { CreateCompra, CreateCompraUseCaseInput } from "@/modules/compras/use-cases/create-compra.use-case";
import { ListCompras } from "@/modules/compras/use-cases/list-compras.use-case";
import { GetCompra } from "@/modules/compras/use-cases/get-compra.use-case";
import { UpdateCompra, UpdateCompraUseCaseInput } from "@/modules/compras/use-cases/update-compra.use-case";
import { CerrarCompra } from "@/modules/compras/use-cases/cerrar-compra.use-case";
import { ReabrirCompra } from "@/modules/compras/use-cases/reabrir-compra.use-case";
import { ObtenerStockTropas } from "@/modules/compras/use-cases/obtener-stock-tropas.use-case";

@injectable()
export class CompraController {
  constructor(
    @inject(DI_TYPES.HttpServer) private readonly httpServer: ExpressAdapter,
    @inject(DI_TYPES.CompraValidation) private readonly validation: CompraValidation,
    @inject(DI_TYPES.CreateCompra) private readonly createCompra: CreateCompra,
    @inject(DI_TYPES.ListCompras) private readonly listCompras: ListCompras,
    @inject(DI_TYPES.GetCompra) private readonly getCompra: GetCompra,
    @inject(DI_TYPES.UpdateCompra) private readonly updateCompra: UpdateCompra,
    @inject(DI_TYPES.CerrarCompra) private readonly cerrarCompra: CerrarCompra,
    @inject(DI_TYPES.ReabrirCompra) private readonly reabrirCompra: ReabrirCompra,
    @inject(DI_TYPES.ObtenerStockTropas) private readonly obtenerStockTropas: ObtenerStockTropas,
  ) {
    this.registerRoutes();
  }

  private registerRoutes(): void {
    // Admin + contable: cargar una compra es una tarea comercial/administrativa.
    this.httpServer.register({
      method: "post",
      url: "/compras",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.create,
      handler: async ({ body, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const input = body as Omit<CreateCompraUseCaseInput, "empresaId">;
        const data = await this.createCompra.execute({ ...input, empresaId: auth.empresaId });
        return new ApiResponse({
          data,
          message: "Compra creada correctamente",
          status: Code.CREATED,
        });
      },
    });

    // Lectura: cualquier usuario con acceso a la empresa activa.
    this.httpServer.register({
      method: "get",
      url: "/compras",
      auth: "jwt-empresa",
      handler: async ({ auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const data = await this.listCompras.execute({ empresaId: auth.empresaId });
        return new ApiResponse({
          data,
          message: "Compras obtenidas correctamente",
          status: Code.OK,
        });
      },
    });

    // OJO con el orden: tiene que registrarse ANTES de `/compras/:id` — si
    // no, Express matchea "stock" contra el param `:id`.
    this.httpServer.register({
      method: "get",
      url: "/compras/stock",
      auth: "jwt-empresa",
      handler: async ({ auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const data = await this.obtenerStockTropas.execute({ empresaId: auth.empresaId });
        return new ApiResponse({
          data,
          message: "Stock de tropas obtenido correctamente",
          status: Code.OK,
        });
      },
    });

    this.httpServer.register({
      method: "get",
      url: "/compras/:id",
      auth: "jwt-empresa",
      validation: this.validation.getById,
      handler: async ({ params, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const data = await this.getCompra.execute({ id: params.id, empresaId: auth.empresaId });
        return new ApiResponse({
          data,
          message: "Compra obtenida correctamente",
          status: Code.OK,
        });
      },
    });

    // Admin + contable: edita los datos generales. Bloqueado si está cerrada.
    this.httpServer.register({
      method: "patch",
      url: "/compras/:id",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.update,
      handler: async ({ params, body, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const input = body as Omit<UpdateCompraUseCaseInput, "id" | "empresaId">;
        const data = await this.updateCompra.execute({
          ...input,
          id: params.id,
          empresaId: auth.empresaId,
        });
        return new ApiResponse({
          data,
          message: "Compra actualizada correctamente",
          status: Code.OK,
        });
      },
    });

    // Admin + contable: cerrar una compra reconcilia cabezas y calcula rinde.
    this.httpServer.register({
      method: "post",
      url: "/compras/:id/cerrar",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.cerrar,
      handler: async ({ params, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const data = await this.cerrarCompra.execute({ id: params.id, empresaId: auth.empresaId });
        return new ApiResponse({
          data,
          message: "Compra cerrada correctamente",
          status: Code.OK,
        });
      },
    });

    // Admin + contable: deshace el cierre (para corregir algo y volver a cerrar).
    this.httpServer.register({
      method: "post",
      url: "/compras/:id/reabrir",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.reabrir,
      handler: async ({ params, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const data = await this.reabrirCompra.execute({ id: params.id, empresaId: auth.empresaId });
        return new ApiResponse({
          data,
          message: "Compra reabierta correctamente",
          status: Code.OK,
        });
      },
    });
  }
}
