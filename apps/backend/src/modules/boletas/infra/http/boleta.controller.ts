import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, ApiResponse, Code, FileResponse } from "@/shared/infra/http/api.responses";
import { ExpressAdapter } from "@/shared/infra/http/http-server";
import { RoleGroups } from "@/modules/users/domain/role-groups";
import { BoletaValidation } from "@/modules/boletas/infra/http/validation";
import { CreateBoleta, CreateBoletaUseCaseInput } from "@/modules/boletas/use-cases/create-boleta.use-case";
import { ListBoletas } from "@/modules/boletas/use-cases/list-boletas.use-case";
import { GetBoleta } from "@/modules/boletas/use-cases/get-boleta.use-case";
import { GenerarBoletaPdf } from "@/modules/boletas/use-cases/generar-boleta-pdf.use-case";
import { GenerarReporteDiarioPdf } from "@/modules/boletas/use-cases/generar-reporte-diario-pdf.use-case";
import { GenerarReporteDiarioExcel } from "@/modules/boletas/use-cases/generar-reporte-diario-excel.use-case";
import { UpdateBoleta, UpdateBoletaInput } from "@/modules/boletas/use-cases/update-boleta.use-case";
import { DeleteBoleta } from "@/modules/boletas/use-cases/delete-boleta.use-case";

@injectable()
export class BoletaController {
  constructor(
    @inject(DI_TYPES.HttpServer) private readonly httpServer: ExpressAdapter,
    @inject(DI_TYPES.BoletaValidation) private readonly validation: BoletaValidation,
    @inject(DI_TYPES.CreateBoleta) private readonly createBoleta: CreateBoleta,
    @inject(DI_TYPES.ListBoletas) private readonly listBoletas: ListBoletas,
    @inject(DI_TYPES.GetBoleta) private readonly getBoleta: GetBoleta,
    @inject(DI_TYPES.GenerarBoletaPdf) private readonly generarBoletaPdf: GenerarBoletaPdf,
    @inject(DI_TYPES.GenerarReporteDiarioPdf) private readonly generarReporteDiarioPdf: GenerarReporteDiarioPdf,
    @inject(DI_TYPES.GenerarReporteDiarioExcel)
    private readonly generarReporteDiarioExcel: GenerarReporteDiarioExcel,
    @inject(DI_TYPES.UpdateBoleta) private readonly updateBoleta: UpdateBoleta,
    @inject(DI_TYPES.DeleteBoleta) private readonly deleteBoleta: DeleteBoleta,
  ) {
    this.registerRoutes();
  }

  private registerRoutes(): void {
    // Admin, contable, y operario (carga desde el reparto/celular — ver
    // RoleGroups.BoletaLoaders y CreateBoleta).
    this.httpServer.register({
      method: "post",
      url: "/boletas",
      auth: "jwt-empresa",
      roles: RoleGroups.BoletaLoaders,
      validation: this.validation.create,
      handler: async ({ body, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const input = body as Omit<CreateBoletaUseCaseInput, "empresaId">;
        const data = await this.createBoleta.execute({ ...input, empresaId: auth.empresaId });
        return new ApiResponse({
          data,
          message: "Boleta creada correctamente",
          status: Code.CREATED,
        });
      },
    });

    // Lectura: cualquier usuario con acceso a la empresa activa.
    // Paginado opcional (ver BoletaValidation.list): sin page/limit devuelve
    // todo (compatibilidad con pantallas viejas); con cualquiera de los dos,
    // devuelve {items, pagination}.
    this.httpServer.register({
      method: "get",
      url: "/boletas",
      auth: "jwt-empresa",
      validation: this.validation.list,
      handler: async ({ auth, query }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const { page, limit } = query as { page?: number; limit?: number };
        const pagination = page !== undefined || limit !== undefined ? { page: page ?? 1, limit: limit ?? 50 } : undefined;
        const data = await this.listBoletas.execute({ empresaId: auth.empresaId, pagination });
        return new ApiResponse({
          data,
          message: "Boletas obtenidas correctamente",
          status: Code.OK,
        });
      },
    });

    this.httpServer.register({
      method: "get",
      url: "/boletas/:id",
      auth: "jwt-empresa",
      validation: this.validation.getById,
      handler: async ({ params, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const data = await this.getBoleta.execute({ id: params.id, empresaId: auth.empresaId });
        return new ApiResponse({
          data,
          message: "Boleta obtenida correctamente",
          status: Code.OK,
        });
      },
    });

    // OJO con el orden: estas dos rutas (`/boletas/reporte-diario/...`) tienen
    // que registrarse ANTES de `/boletas/:id/pdf` — si no, Express matchea
    // "reporte-diario" contra el param `:id` y nunca llegan acá.
    this.httpServer.register({
      method: "get",
      url: "/boletas/reporte-diario/pdf",
      auth: "jwt-empresa",
      validation: this.validation.reporteDiario,
      handler: async ({ query, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const { fecha } = query as unknown as { fecha: Date };
        const { buffer, filename } = await this.generarReporteDiarioPdf.execute({
          empresaId: auth.empresaId,
          fecha,
        });
        return new FileResponse(buffer, filename, "application/pdf", "inline");
      },
    });

    this.httpServer.register({
      method: "get",
      url: "/boletas/reporte-diario/excel",
      auth: "jwt-empresa",
      validation: this.validation.reporteDiario,
      handler: async ({ query, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const { fecha } = query as unknown as { fecha: Date };
        const { buffer, filename } = await this.generarReporteDiarioExcel.execute({
          empresaId: auth.empresaId,
          fecha,
        });
        return new FileResponse(
          buffer,
          filename,
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "attachment",
        );
      },
    });

    this.httpServer.register({
      method: "get",
      url: "/boletas/:id/pdf",
      auth: "jwt-empresa",
      validation: this.validation.pdf,
      handler: async ({ params, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const { buffer, filename } = await this.generarBoletaPdf.execute({
          id: params.id,
          empresaId: auth.empresaId,
        });
        return new FileResponse(buffer, filename, "application/pdf", "inline");
      },
    });

    // Operario/admin/contable: corrige fecha/número/comentarios de una
    // boleta ya cargada — para arreglar una carga mal hecha.
    this.httpServer.register({
      method: "patch",
      url: "/boletas/:id",
      auth: "jwt-empresa",
      roles: RoleGroups.BoletaLoaders,
      validation: this.validation.update,
      handler: async ({ params, body, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const data = await this.updateBoleta.execute({
          id: params.id,
          empresaId: auth.empresaId,
          ...(body as Omit<UpdateBoletaInput, "id" | "empresaId">),
        });
        return new ApiResponse({
          data,
          message: "Boleta actualizada correctamente",
          status: Code.OK,
        });
      },
    });

    // Operario/admin/contable: borra (soft-delete) la boleta entera y sus
    // ventas — para arreglar una carga mal hecha desde cero.
    this.httpServer.register({
      method: "delete",
      url: "/boletas/:id",
      auth: "jwt-empresa",
      roles: RoleGroups.BoletaLoaders,
      validation: this.validation.delete,
      handler: async ({ params, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        await this.deleteBoleta.execute({ id: params.id, empresaId: auth.empresaId });
        return new ApiResponse({
          data: null,
          message: "Boleta eliminada correctamente",
          status: Code.OK,
        });
      },
    });
  }
}
