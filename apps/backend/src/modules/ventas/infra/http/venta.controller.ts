import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, ApiResponse, Code } from "@/shared/infra/http/api.responses";
import { ExpressAdapter } from "@/shared/infra/http/http-server";
import { RoleGroups } from "@/modules/users/domain/role-groups";
import { VentaValidation } from "@/modules/ventas/infra/http/validation";
import { CreateVenta, CreateVentaUseCaseInput } from "@/modules/ventas/use-cases/create-venta.use-case";
import { ListVentas } from "@/modules/ventas/use-cases/list-ventas.use-case";
import { GetVenta } from "@/modules/ventas/use-cases/get-venta.use-case";
import { SetPrecioVenta } from "@/modules/ventas/use-cases/set-precio-venta.use-case";
import { SetPrecioVentasLote } from "@/modules/ventas/use-cases/set-precio-ventas-lote.use-case";
import { UpdateVentaItem, UpdateVentaItemInput } from "@/modules/ventas/use-cases/update-venta-item.use-case";
import { DeleteVenta } from "@/modules/ventas/use-cases/delete-venta.use-case";

@injectable()
export class VentaController {
  constructor(
    @inject(DI_TYPES.HttpServer) private readonly httpServer: ExpressAdapter,
    @inject(DI_TYPES.VentaValidation) private readonly validation: VentaValidation,
    @inject(DI_TYPES.CreateVenta) private readonly createVenta: CreateVenta,
    @inject(DI_TYPES.ListVentas) private readonly listVentas: ListVentas,
    @inject(DI_TYPES.GetVenta) private readonly getVenta: GetVenta,
    @inject(DI_TYPES.SetPrecioVenta) private readonly setPrecioVenta: SetPrecioVenta,
    @inject(DI_TYPES.SetPrecioVentasLote) private readonly setPrecioVentasLote: SetPrecioVentasLote,
    @inject(DI_TYPES.UpdateVentaItem) private readonly updateVentaItem: UpdateVentaItem,
    @inject(DI_TYPES.DeleteVenta) private readonly deleteVenta: DeleteVenta,
  ) {
    this.registerRoutes();
  }

  private registerRoutes(): void {
    // Admin + contable: cargar una venta es una tarea comercial/administrativa.
    this.httpServer.register({
      method: "post",
      url: "/ventas",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.create,
      handler: async ({ body, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const input = body as Omit<CreateVentaUseCaseInput, "empresaId">;
        const data = await this.createVenta.execute({ ...input, empresaId: auth.empresaId });
        return new ApiResponse({
          data,
          message: "Venta creada correctamente",
          status: Code.CREATED,
        });
      },
    });

    // Lectura: cualquier usuario con acceso a la empresa activa.
    // Paginado opcional (ver VentaValidation.list): sin page/limit devuelve
    // todo (compatibilidad con pantallas viejas); con cualquiera de los dos,
    // devuelve {items, pagination}.
    this.httpServer.register({
      method: "get",
      url: "/ventas",
      auth: "jwt-empresa",
      validation: this.validation.list,
      handler: async ({ auth, query }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const { page, limit } = query as { page?: number; limit?: number };
        const pagination = page !== undefined || limit !== undefined ? { page: page ?? 1, limit: limit ?? 50 } : undefined;
        const data = await this.listVentas.execute({ empresaId: auth.empresaId, pagination });
        return new ApiResponse({
          data,
          message: "Ventas obtenidas correctamente",
          status: Code.OK,
        });
      },
    });

    this.httpServer.register({
      method: "get",
      url: "/ventas/:id",
      auth: "jwt-empresa",
      validation: this.validation.getById,
      handler: async ({ params, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const data = await this.getVenta.execute({ id: params.id, empresaId: auth.empresaId });
        return new ApiResponse({
          data,
          message: "Venta obtenida correctamente",
          status: Code.OK,
        });
      },
    });

    // Admin + contable: completa el precio de una venta que se cargó sin él
    // (flujo del operario vía boletas) — nunca el operario.
    this.httpServer.register({
      method: "patch",
      url: "/ventas/:id/precio",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.setPrecio,
      handler: async ({ params, body, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const data = await this.setPrecioVenta.execute({
          id: params.id,
          empresaId: auth.empresaId,
          precioKg: (body as { precioKg: number }).precioKg,
        });
        return new ApiResponse({
          data,
          message: "Precio cargado correctamente",
          status: Code.OK,
        });
      },
    });

    // Admin + contable: aplica el mismo precio a varias ventas de un saque
    // (ej. todas las de una categoría/presentación dentro de una boleta) en
    // un solo request — ver `SetPrecioVentasLote`.
    this.httpServer.register({
      method: "patch",
      url: "/ventas/precio-lote",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.setPrecioLote,
      handler: async ({ body, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const { ventaIds, precioKg } = body as { ventaIds: string[]; precioKg: number };
        const data = await this.setPrecioVentasLote.execute({ empresaId: auth.empresaId, ventaIds, precioKg });
        return new ApiResponse({
          data,
          message: "Precio cargado correctamente",
          status: Code.OK,
        });
      },
    });

    // Operario/admin/contable: corrige garrón/kg/categoría/comentarios de
    // una línea ya cargada — para arreglar una carga mal hecha. No toca
    // precioKg (eso es PATCH /ventas/:id/precio).
    this.httpServer.register({
      method: "patch",
      url: "/ventas/:id",
      auth: "jwt-empresa",
      roles: RoleGroups.BoletaLoaders,
      validation: this.validation.updateItem,
      handler: async ({ params, body, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const data = await this.updateVentaItem.execute({
          id: params.id,
          empresaId: auth.empresaId,
          ...(body as Omit<UpdateVentaItemInput, "id" | "empresaId">),
        });
        return new ApiResponse({
          data,
          message: "Venta actualizada correctamente",
          status: Code.OK,
        });
      },
    });

    // Operario/admin/contable: borra (soft-delete) una línea de venta.
    this.httpServer.register({
      method: "delete",
      url: "/ventas/:id",
      auth: "jwt-empresa",
      roles: RoleGroups.BoletaLoaders,
      validation: this.validation.delete,
      handler: async ({ params, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        await this.deleteVenta.execute({ id: params.id, empresaId: auth.empresaId });
        return new ApiResponse({
          data: null,
          message: "Venta eliminada correctamente",
          status: Code.OK,
        });
      },
    });
  }
}
