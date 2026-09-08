import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, ApiResponse, Code, FileResponse } from "@/shared/infra/http/api.responses";
import { ExpressAdapter } from "@/shared/infra/http/http-server";
import { RoleGroups } from "@/modules/users/domain/role-groups";
import { Permisos } from "@/modules/permisos/domain/permiso";
import { MedioPago } from "@/modules/cobros/domain/medio-pago";
import { InformeCobranzasValidation } from "@/modules/informe-cobranzas/infra/http/validation";
import { ObtenerInformeCobranzas } from "@/modules/informe-cobranzas/use-cases/obtener-informe-cobranzas.use-case";
import { GenerarInformeCobranzasPdf } from "@/modules/informe-cobranzas/use-cases/generar-informe-cobranzas-pdf.use-case";
import { GenerarInformeCobranzasExcel } from "@/modules/informe-cobranzas/use-cases/generar-informe-cobranzas-excel.use-case";

interface FiltrosQuery {
  desde?: Date;
  hasta?: Date;
  medioPago?: MedioPago;
}

@injectable()
export class InformeCobranzasController {
  constructor(
    @inject(DI_TYPES.HttpServer) private readonly httpServer: ExpressAdapter,
    @inject(DI_TYPES.InformeCobranzasValidation) private readonly validation: InformeCobranzasValidation,
    @inject(DI_TYPES.ObtenerInformeCobranzas) private readonly obtenerInformeCobranzas: ObtenerInformeCobranzas,
    @inject(DI_TYPES.GenerarInformeCobranzasPdf) private readonly generarInformeCobranzasPdf: GenerarInformeCobranzasPdf,
    @inject(DI_TYPES.GenerarInformeCobranzasExcel)
    private readonly generarInformeCobranzasExcel: GenerarInformeCobranzasExcel,
  ) {
    this.registerRoutes();
  }

  private registerRoutes(): void {
    // Visibilidad — admin y contable (mismo grupo que cobros/cuenta-corriente).
    this.httpServer.register({
      method: "get",
      url: "/informe-cobranzas",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      permisos: [Permisos.VER_INFORME_COBRANZAS],
      validation: this.validation.get,
      handler: async ({ query, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const { desde, hasta, medioPago } = query as unknown as FiltrosQuery;
        const data = await this.obtenerInformeCobranzas.execute({ empresaId: auth.empresaId, desde, hasta, medioPago });
        return new ApiResponse({ data, message: "Informe de cobranzas obtenido correctamente", status: Code.OK });
      },
    });

    this.httpServer.register({
      method: "get",
      url: "/informe-cobranzas/pdf",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      permisos: [Permisos.VER_INFORME_COBRANZAS],
      validation: this.validation.pdf,
      handler: async ({ query, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const { desde, hasta, medioPago } = query as unknown as FiltrosQuery;
        const { buffer, filename } = await this.generarInformeCobranzasPdf.execute({
          empresaId: auth.empresaId,
          desde,
          hasta,
          medioPago,
        });
        return new FileResponse(buffer, filename, "application/pdf", "inline");
      },
    });

    this.httpServer.register({
      method: "get",
      url: "/informe-cobranzas/excel",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      permisos: [Permisos.VER_INFORME_COBRANZAS],
      validation: this.validation.excel,
      handler: async ({ query, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const { desde, hasta, medioPago } = query as unknown as FiltrosQuery;
        const { buffer, filename } = await this.generarInformeCobranzasExcel.execute({
          empresaId: auth.empresaId,
          desde,
          hasta,
          medioPago,
        });
        return new FileResponse(
          buffer,
          filename,
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "attachment",
        );
      },
    });
  }
}
