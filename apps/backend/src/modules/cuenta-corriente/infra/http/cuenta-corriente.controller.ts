import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, ApiResponse, Code, FileResponse } from "@/shared/infra/http/api.responses";
import { ExpressAdapter } from "@/shared/infra/http/http-server";
import { RoleGroups } from "@/modules/users/domain/role-groups";
import { Permisos } from "@/modules/permisos/domain/permiso";
import { CuentaCorrienteValidation } from "@/modules/cuenta-corriente/infra/http/validation";
import { ObtenerSaldoCliente } from "@/modules/cuenta-corriente/use-cases/obtener-saldo-cliente.use-case";
import { ObtenerSaldosClientes } from "@/modules/cuenta-corriente/use-cases/obtener-saldos-clientes.use-case";
import { ObtenerMovimientosCuentaCorriente } from "@/modules/cuenta-corriente/use-cases/obtener-movimientos-cuenta-corriente.use-case";
import { GenerarResumenCuentaPdf } from "@/modules/cuenta-corriente/use-cases/generar-resumen-cuenta-pdf.use-case";
import { GenerarResumenCuentaExcel } from "@/modules/cuenta-corriente/use-cases/generar-resumen-cuenta-excel.use-case";
import { ObtenerConciliacionClientes } from "@/modules/cuenta-corriente/use-cases/obtener-conciliacion-clientes.use-case";

@injectable()
export class CuentaCorrienteController {
  constructor(
    @inject(DI_TYPES.HttpServer) private readonly httpServer: ExpressAdapter,
    @inject(DI_TYPES.CuentaCorrienteValidation) private readonly validation: CuentaCorrienteValidation,
    @inject(DI_TYPES.ObtenerSaldoCliente) private readonly obtenerSaldoCliente: ObtenerSaldoCliente,
    @inject(DI_TYPES.ObtenerSaldosClientes) private readonly obtenerSaldosClientes: ObtenerSaldosClientes,
    @inject(DI_TYPES.ObtenerMovimientosCuentaCorriente)
    private readonly obtenerMovimientosCuentaCorriente: ObtenerMovimientosCuentaCorriente,
    @inject(DI_TYPES.GenerarResumenCuentaPdf) private readonly generarResumenCuentaPdf: GenerarResumenCuentaPdf,
    @inject(DI_TYPES.GenerarResumenCuentaExcel)
    private readonly generarResumenCuentaExcel: GenerarResumenCuentaExcel,
    @inject(DI_TYPES.ObtenerConciliacionClientes) private readonly obtenerConciliacionClientes: ObtenerConciliacionClientes,
  ) {
    this.registerRoutes();
  }

  private registerRoutes(): void {
    // Visibilidad de saldos/movimientos — admin y contable (mismo grupo que cobros/cheques).
    this.httpServer.register({
      method: "get",
      url: "/cuenta-corriente/saldos",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      // Foto agregada de saldos de TODOS los clientes — vista sensible, permiso aparte del
      // saldo de UN cliente puntual de abajo (esa la sigue necesitando cualquier contable
      // para el formulario de "nuevo cobro").
      permisos: [Permisos.VER_CUENTA_CORRIENTE],
      handler: async ({ auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const data = await this.obtenerSaldosClientes.execute({ empresaId: auth.empresaId });
        return new ApiResponse({ data, message: "Saldos obtenidos correctamente", status: Code.OK });
      },
    });

    // OJO: esta ruta NO lleva `permisos` a propósito — el formulario de "nuevo
    // cobro" (modules/cobros en el frontend) necesita el saldo de un cliente puntual
    // para cualquiera que pueda registrar cobros, tenga o no VER_CUENTA_CORRIENTE.
    // Solo el listado agregado (arriba) y los movimientos/resúmenes (abajo) llevan permiso.
    this.httpServer.register({
      method: "get",
      url: "/cuenta-corriente/:clienteId/saldo",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.saldo,
      handler: async ({ params, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const data = await this.obtenerSaldoCliente.execute({
          clienteId: params.clienteId,
          empresaId: auth.empresaId,
        });
        return new ApiResponse({ data, message: "Saldo obtenido correctamente", status: Code.OK });
      },
    });

    this.httpServer.register({
      method: "get",
      url: "/cuenta-corriente/:clienteId/movimientos",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      permisos: [Permisos.VER_CUENTA_CORRIENTE],
      validation: this.validation.movimientos,
      handler: async ({ params, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const data = await this.obtenerMovimientosCuentaCorriente.execute({
          clienteId: params.clienteId,
          empresaId: auth.empresaId,
        });
        return new ApiResponse({ data, message: "Movimientos obtenidos correctamente", status: Code.OK });
      },
    });

    this.httpServer.register({
      method: "get",
      url: "/cuenta-corriente/:clienteId/resumen/pdf",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      permisos: [Permisos.VER_CUENTA_CORRIENTE],
      validation: this.validation.resumenPdf,
      handler: async ({ params, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const { buffer, filename } = await this.generarResumenCuentaPdf.execute({
          clienteId: params.clienteId,
          empresaId: auth.empresaId,
        });
        return new FileResponse(buffer, filename, "application/pdf", "inline");
      },
    });

    this.httpServer.register({
      method: "get",
      url: "/cuenta-corriente/:clienteId/resumen/excel",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      permisos: [Permisos.VER_CUENTA_CORRIENTE],
      validation: this.validation.resumenExcel,
      handler: async ({ params, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const { buffer, filename } = await this.generarResumenCuentaExcel.execute({
          clienteId: params.clienteId,
          empresaId: auth.empresaId,
        });
        return new FileResponse(
          buffer,
          filename,
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "attachment",
        );
      },
    });

    // ─────────── Conciliación auxiliar vs. contabilidad (fase 2) ───────────
    this.httpServer.register({
      method: "get",
      url: "/cuenta-corriente/conciliacion",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      permisos: [Permisos.VER_CONTABILIDAD],
      validation: this.validation.conciliacion,
      handler: async ({ query, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const data = await this.obtenerConciliacionClientes.execute({
          empresaId: auth.empresaId,
          cuentaId: (query as { cuentaId: string }).cuentaId,
        });
        return new ApiResponse({ data, message: "Conciliación obtenida correctamente", status: Code.OK });
      },
    });
  }
}
