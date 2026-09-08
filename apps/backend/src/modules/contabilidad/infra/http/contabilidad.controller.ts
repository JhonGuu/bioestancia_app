import multer from "multer";
import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, ApiResponse, Code, FileResponse } from "@/shared/infra/http/api.responses";
import { ExpressAdapter } from "@/shared/infra/http/http-server";
import { Permisos } from "@/modules/permisos/domain/permiso";
import { RoleGroups } from "@/modules/users/domain/role-groups";
import { ContabilidadValidation } from "@/modules/contabilidad/infra/http/validation";
import { ListarPlanCuentas } from "@/modules/contabilidad/use-cases/listar-plan-cuentas.use-case";
import { CrearCuenta } from "@/modules/contabilidad/use-cases/crear-cuenta.use-case";
import { ActualizarCuenta } from "@/modules/contabilidad/use-cases/actualizar-cuenta.use-case";
import { EliminarCuenta } from "@/modules/contabilidad/use-cases/eliminar-cuenta.use-case";
import { SembrarPlanCuentas } from "@/modules/contabilidad/use-cases/sembrar-plan-cuentas.use-case";
import { CrearEjercicio } from "@/modules/contabilidad/use-cases/crear-ejercicio.use-case";
import { ListarEjercicios } from "@/modules/contabilidad/use-cases/listar-ejercicios.use-case";
import { CambiarEstadoEjercicio } from "@/modules/contabilidad/use-cases/cambiar-estado-ejercicio.use-case";
import { CambiarEstadoPeriodo } from "@/modules/contabilidad/use-cases/cambiar-estado-periodo.use-case";
import { ListarAsientos } from "@/modules/contabilidad/use-cases/listar-asientos.use-case";
import { ObtenerAsiento } from "@/modules/contabilidad/use-cases/obtener-asiento.use-case";
import { CrearAsiento } from "@/modules/contabilidad/use-cases/crear-asiento.use-case";
import { ActualizarAsiento } from "@/modules/contabilidad/use-cases/actualizar-asiento.use-case";
import { ConfirmarAsiento } from "@/modules/contabilidad/use-cases/confirmar-asiento.use-case";
import { AnularAsiento } from "@/modules/contabilidad/use-cases/anular-asiento.use-case";
import { GenerarAsientoApertura } from "@/modules/contabilidad/use-cases/generar-asiento-apertura.use-case";
import {
  ActualizarReglaAsiento,
  CrearReglaAsiento,
  EliminarReglaAsiento,
  ListarReglasAsiento,
} from "@/modules/contabilidad/use-cases/gestionar-reglas-asiento.use-case";
import {
  AUXILIARES_POR_EVENTO,
  EVENTOS_ASIENTO_LABELS,
  EXPRESIONES_POR_EVENTO,
  EventoAsiento,
} from "@/modules/contabilidad/domain/regla-asiento";
import { ObtenerLibroDiario } from "@/modules/contabilidad/use-cases/obtener-libro-diario.use-case";
import { ObtenerMayorCuenta } from "@/modules/contabilidad/use-cases/obtener-mayor-cuenta.use-case";
import { ObtenerSumasYSaldos } from "@/modules/contabilidad/use-cases/obtener-sumas-y-saldos.use-case";
import {
  ActualizarCentroCosto,
  CrearCentroCosto,
  EliminarCentroCosto,
  ListarCentrosCosto,
} from "@/modules/contabilidad/use-cases/gestionar-centros-costo.use-case";
import { PrevisualizarImportacionPlanCuentas } from "@/modules/contabilidad/use-cases/importar/previsualizar-importacion-plan-cuentas.use-case";
import { ConfirmarImportacionPlanCuentas } from "@/modules/contabilidad/use-cases/importar/confirmar-importacion-plan-cuentas.use-case";
import { PrevisualizarImportacionAsientos } from "@/modules/contabilidad/use-cases/importar/previsualizar-importacion-asientos.use-case";
import { ConfirmarImportacionAsientos } from "@/modules/contabilidad/use-cases/importar/confirmar-importacion-asientos.use-case";
import { PrevisualizarImportacionSaldosIniciales } from "@/modules/contabilidad/use-cases/importar/previsualizar-importacion-saldos-iniciales.use-case";
import {
  GenerarPlantillaImportacion,
  TipoPlantillaImportacion,
} from "@/modules/contabilidad/use-cases/importar/generar-plantilla-importacion.use-case";
import { AsientoAImportar } from "@/modules/contabilidad/domain/importacion-asientos";
import { CuentaAImportar } from "@/modules/contabilidad/domain/importacion-plan-cuentas";

// Igual que `FichajeController` (subida del Excel del lector de huellas): en
// memoria, sin paso intermedio a disco — el archivo se parsea y se descarta.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

/**
 * Rutas del módulo contable.
 *
 * Dos capas de autorización, como el resto del sistema: `roles` gobierna
 * qué puede HACER alguien (acá, administración y contaduría) y `permisos`
 * gobierna qué información sensible puede VER. La contabilidad es lo más
 * sensible que tiene el sistema, así que todo pide `VER_CONTABILIDAD`; las
 * acciones estructurales piden además su permiso específico.
 */
@injectable()
export class ContabilidadController {
  constructor(
    @inject(DI_TYPES.HttpServer) private readonly httpServer: ExpressAdapter,
    @inject(DI_TYPES.ContabilidadValidation) private readonly validation: ContabilidadValidation,
    @inject(DI_TYPES.ListarPlanCuentas) private readonly listarPlanCuentas: ListarPlanCuentas,
    @inject(DI_TYPES.CrearCuenta) private readonly crearCuenta: CrearCuenta,
    @inject(DI_TYPES.ActualizarCuenta) private readonly actualizarCuenta: ActualizarCuenta,
    @inject(DI_TYPES.EliminarCuenta) private readonly eliminarCuenta: EliminarCuenta,
    @inject(DI_TYPES.SembrarPlanCuentas) private readonly sembrarPlanCuentas: SembrarPlanCuentas,
    @inject(DI_TYPES.ListarCentrosCosto) private readonly listarCentrosCosto: ListarCentrosCosto,
    @inject(DI_TYPES.CrearCentroCosto) private readonly crearCentroCosto: CrearCentroCosto,
    @inject(DI_TYPES.ActualizarCentroCosto) private readonly actualizarCentroCosto: ActualizarCentroCosto,
    @inject(DI_TYPES.EliminarCentroCosto) private readonly eliminarCentroCosto: EliminarCentroCosto,
    @inject(DI_TYPES.CrearEjercicio) private readonly crearEjercicio: CrearEjercicio,
    @inject(DI_TYPES.ListarEjercicios) private readonly listarEjercicios: ListarEjercicios,
    @inject(DI_TYPES.CambiarEstadoEjercicio) private readonly cambiarEstadoEjercicio: CambiarEstadoEjercicio,
    @inject(DI_TYPES.CambiarEstadoPeriodo) private readonly cambiarEstadoPeriodo: CambiarEstadoPeriodo,
    @inject(DI_TYPES.ListarAsientos) private readonly listarAsientos: ListarAsientos,
    @inject(DI_TYPES.ObtenerAsiento) private readonly obtenerAsiento: ObtenerAsiento,
    @inject(DI_TYPES.CrearAsiento) private readonly crearAsiento: CrearAsiento,
    @inject(DI_TYPES.ActualizarAsiento) private readonly actualizarAsiento: ActualizarAsiento,
    @inject(DI_TYPES.ConfirmarAsiento) private readonly confirmarAsiento: ConfirmarAsiento,
    @inject(DI_TYPES.AnularAsiento) private readonly anularAsiento: AnularAsiento,
    @inject(DI_TYPES.GenerarAsientoApertura) private readonly generarApertura: GenerarAsientoApertura,
    @inject(DI_TYPES.ObtenerLibroDiario) private readonly obtenerLibroDiario: ObtenerLibroDiario,
    @inject(DI_TYPES.ObtenerMayorCuenta) private readonly obtenerMayorCuenta: ObtenerMayorCuenta,
    @inject(DI_TYPES.ObtenerSumasYSaldos) private readonly obtenerSumasYSaldos: ObtenerSumasYSaldos,
    @inject(DI_TYPES.PrevisualizarImportacionPlanCuentas)
    private readonly previsualizarImportacionPlanCuentas: PrevisualizarImportacionPlanCuentas,
    @inject(DI_TYPES.ConfirmarImportacionPlanCuentas)
    private readonly confirmarImportacionPlanCuentas: ConfirmarImportacionPlanCuentas,
    @inject(DI_TYPES.PrevisualizarImportacionAsientos)
    private readonly previsualizarImportacionAsientos: PrevisualizarImportacionAsientos,
    @inject(DI_TYPES.ConfirmarImportacionAsientos)
    private readonly confirmarImportacionAsientos: ConfirmarImportacionAsientos,
    @inject(DI_TYPES.PrevisualizarImportacionSaldosIniciales)
    private readonly previsualizarImportacionSaldosIniciales: PrevisualizarImportacionSaldosIniciales,
    @inject(DI_TYPES.GenerarPlantillaImportacion) private readonly generarPlantillaImportacion: GenerarPlantillaImportacion,
    @inject(DI_TYPES.ListarReglasAsiento) private readonly listarReglasAsiento: ListarReglasAsiento,
    @inject(DI_TYPES.CrearReglaAsiento) private readonly crearReglaAsiento: CrearReglaAsiento,
    @inject(DI_TYPES.ActualizarReglaAsiento) private readonly actualizarReglaAsiento: ActualizarReglaAsiento,
    @inject(DI_TYPES.EliminarReglaAsiento) private readonly eliminarReglaAsiento: EliminarReglaAsiento,
  ) {
    this.registerRoutes();
  }

  /** Toda ruta de este módulo opera sobre la empresa activa. */
  private empresaId(auth?: { empresaId?: string }): string {
    if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
    return auth.empresaId;
  }

  private registerRoutes(): void {
    // ─────────────────────── Plan de cuentas ───────────────────────
    this.httpServer.register({
      method: "get",
      url: "/contabilidad/plan-cuentas",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      permisos: [Permisos.VER_CONTABILIDAD],
      handler: async ({ auth }) => {
        const data = await this.listarPlanCuentas.execute(this.empresaId(auth));
        return new ApiResponse({ data, message: "Plan de cuentas obtenido correctamente", status: Code.OK });
      },
    });

    // Siembra el catálogo base. Va ANTES de las rutas con :id para que
    // Express no matchee "sembrar" como un id.
    this.httpServer.register({
      method: "post",
      url: "/contabilidad/plan-cuentas/sembrar",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminOnly,
      permisos: [Permisos.ADMINISTRAR_PLAN_CUENTAS],
      validation: this.validation.sembrarPlanCuentas,
      handler: async ({ body, auth }) => {
        const { forzar } = body as { forzar: boolean };
        const data = await this.sembrarPlanCuentas.execute(this.empresaId(auth), forzar);
        return new ApiResponse({
          data,
          message: `Se crearon ${data.creadas} cuentas`,
          status: Code.CREATED,
        });
      },
    });

    this.httpServer.register({
      method: "post",
      url: "/contabilidad/plan-cuentas",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      permisos: [Permisos.ADMINISTRAR_PLAN_CUENTAS],
      validation: this.validation.crearCuenta,
      handler: async ({ body, auth }) => {
        const data = await this.crearCuenta.execute({
          ...(body as Omit<Parameters<CrearCuenta["execute"]>[0], "empresaId">),
          empresaId: this.empresaId(auth),
        });
        return new ApiResponse({ data, message: "Cuenta creada correctamente", status: Code.CREATED });
      },
    });

    this.httpServer.register({
      method: "patch",
      url: "/contabilidad/plan-cuentas/:id",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      permisos: [Permisos.ADMINISTRAR_PLAN_CUENTAS],
      validation: this.validation.actualizarCuenta,
      handler: async ({ params, body, auth }) => {
        const data = await this.actualizarCuenta.execute(params.id, this.empresaId(auth), body as never);
        return new ApiResponse({ data, message: "Cuenta actualizada correctamente", status: Code.OK });
      },
    });

    this.httpServer.register({
      method: "delete",
      url: "/contabilidad/plan-cuentas/:id",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      permisos: [Permisos.ADMINISTRAR_PLAN_CUENTAS],
      validation: this.validation.idParams,
      handler: async ({ params, auth }) => {
        const data = await this.eliminarCuenta.execute(params.id, this.empresaId(auth));
        return new ApiResponse({ data, message: data.mensaje, status: Code.OK });
      },
    });

    // ─────────────────────── Centros de costo ───────────────────────
    this.httpServer.register({
      method: "get",
      url: "/contabilidad/centros-costo",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      permisos: [Permisos.VER_CONTABILIDAD],
      handler: async ({ auth }) => {
        const data = await this.listarCentrosCosto.execute(this.empresaId(auth));
        return new ApiResponse({ data, message: "Centros de costo obtenidos correctamente", status: Code.OK });
      },
    });

    this.httpServer.register({
      method: "post",
      url: "/contabilidad/centros-costo",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      permisos: [Permisos.ADMINISTRAR_PLAN_CUENTAS],
      validation: this.validation.crearCentroCosto,
      handler: async ({ body, auth }) => {
        const { codigo, nombre } = body as { codigo: string; nombre: string };
        const data = await this.crearCentroCosto.execute({ empresaId: this.empresaId(auth), codigo, nombre });
        return new ApiResponse({ data, message: "Centro de costo creado correctamente", status: Code.CREATED });
      },
    });

    this.httpServer.register({
      method: "patch",
      url: "/contabilidad/centros-costo/:id",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      permisos: [Permisos.ADMINISTRAR_PLAN_CUENTAS],
      validation: this.validation.actualizarCentroCosto,
      handler: async ({ params, body, auth }) => {
        const data = await this.actualizarCentroCosto.execute(params.id, this.empresaId(auth), body as never);
        return new ApiResponse({ data, message: "Centro de costo actualizado correctamente", status: Code.OK });
      },
    });

    this.httpServer.register({
      method: "delete",
      url: "/contabilidad/centros-costo/:id",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      permisos: [Permisos.ADMINISTRAR_PLAN_CUENTAS],
      validation: this.validation.idParams,
      handler: async ({ params, auth }) => {
        const data = await this.eliminarCentroCosto.execute(params.id, this.empresaId(auth));
        return new ApiResponse({ data, message: data.mensaje, status: Code.OK });
      },
    });

    // ─────────────────── Ejercicios y períodos ───────────────────
    this.httpServer.register({
      method: "get",
      url: "/contabilidad/ejercicios",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      permisos: [Permisos.VER_CONTABILIDAD],
      handler: async ({ auth }) => {
        const data = await this.listarEjercicios.execute(this.empresaId(auth));
        return new ApiResponse({ data, message: "Ejercicios obtenidos correctamente", status: Code.OK });
      },
    });

    this.httpServer.register({
      method: "post",
      url: "/contabilidad/ejercicios",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      permisos: [Permisos.ADMINISTRAR_PLAN_CUENTAS],
      validation: this.validation.crearEjercicio,
      handler: async ({ body, auth }) => {
        const { nombre, fechaInicio, fechaFin } = body as {
          nombre?: string;
          fechaInicio: Date;
          fechaFin: Date;
        };
        const data = await this.crearEjercicio.execute({
          empresaId: this.empresaId(auth),
          nombre,
          fechaInicio,
          fechaFin,
        });
        return new ApiResponse({ data, message: "Ejercicio creado correctamente", status: Code.CREATED });
      },
    });

    this.httpServer.register({
      method: "patch",
      url: "/contabilidad/ejercicios/:id/estado",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      permisos: [Permisos.CERRAR_PERIODOS],
      validation: this.validation.cambiarEstadoEjercicio,
      handler: async ({ params, body, auth }) => {
        const { estado } = body as { estado: Parameters<CambiarEstadoEjercicio["execute"]>[2] };
        const data = await this.cambiarEstadoEjercicio.execute(params.id, this.empresaId(auth), estado);
        return new ApiResponse({ data, message: "Estado del ejercicio actualizado", status: Code.OK });
      },
    });

    this.httpServer.register({
      method: "patch",
      url: "/contabilidad/periodos/:id/estado",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      permisos: [Permisos.CERRAR_PERIODOS],
      validation: this.validation.cambiarEstadoPeriodo,
      handler: async ({ params, body, auth }) => {
        const { estado } = body as { estado: Parameters<CambiarEstadoPeriodo["execute"]>[2] };
        const data = await this.cambiarEstadoPeriodo.execute(params.id, this.empresaId(auth), estado);
        return new ApiResponse({ data, message: "Estado del período actualizado", status: Code.OK });
      },
    });

    // ─────────────────────────── Asientos ───────────────────────────
    this.httpServer.register({
      method: "get",
      url: "/contabilidad/asientos",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      permisos: [Permisos.VER_CONTABILIDAD],
      validation: this.validation.listarAsientos,
      handler: async ({ query, auth }) => {
        const data = await this.listarAsientos.execute({
          ...(query as Omit<Parameters<ListarAsientos["execute"]>[0], "empresaId">),
          empresaId: this.empresaId(auth),
        });
        return new ApiResponse({ data, message: "Asientos obtenidos correctamente", status: Code.OK });
      },
    });

    // Antes de /asientos/:id — si no, "apertura" entraría como id.
    this.httpServer.register({
      method: "post",
      url: "/contabilidad/asientos/apertura",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      permisos: [Permisos.VER_CONTABILIDAD],
      validation: this.validation.generarApertura,
      handler: async ({ body, auth }) => {
        const data = await this.generarApertura.execute({
          ...(body as Omit<Parameters<GenerarAsientoApertura["execute"]>[0], "empresaId">),
          empresaId: this.empresaId(auth),
        });
        return new ApiResponse({
          data,
          message: "Asiento de apertura generado — revisalo y confirmalo",
          status: Code.CREATED,
        });
      },
    });

    this.httpServer.register({
      method: "get",
      url: "/contabilidad/asientos/:id",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      permisos: [Permisos.VER_CONTABILIDAD],
      validation: this.validation.idParams,
      handler: async ({ params, auth }) => {
        const data = await this.obtenerAsiento.execute(params.id, this.empresaId(auth));
        return new ApiResponse({ data, message: "Asiento obtenido correctamente", status: Code.OK });
      },
    });

    this.httpServer.register({
      method: "post",
      url: "/contabilidad/asientos",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      permisos: [Permisos.VER_CONTABILIDAD],
      validation: this.validation.crearAsiento,
      handler: async ({ body, auth }) => {
        const data = await this.crearAsiento.execute({
          ...(body as Omit<Parameters<CrearAsiento["execute"]>[0], "empresaId">),
          empresaId: this.empresaId(auth),
        });
        return new ApiResponse({ data, message: "Asiento cargado correctamente", status: Code.CREATED });
      },
    });

    this.httpServer.register({
      method: "patch",
      url: "/contabilidad/asientos/:id",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      permisos: [Permisos.VER_CONTABILIDAD],
      validation: this.validation.actualizarAsiento,
      handler: async ({ params, body, auth }) => {
        const data = await this.actualizarAsiento.execute(params.id, this.empresaId(auth), body as never);
        return new ApiResponse({ data, message: "Asiento actualizado correctamente", status: Code.OK });
      },
    });

    this.httpServer.register({
      method: "post",
      url: "/contabilidad/asientos/:id/confirmar",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      permisos: [Permisos.VER_CONTABILIDAD],
      validation: this.validation.idParams,
      handler: async ({ params, auth }) => {
        const data = await this.confirmarAsiento.execute(params.id, this.empresaId(auth));
        return new ApiResponse({
          data,
          message: `Asiento confirmado con el N° ${data.numero}`,
          status: Code.OK,
        });
      },
    });

    this.httpServer.register({
      method: "delete",
      url: "/contabilidad/asientos/:id",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      permisos: [Permisos.VER_CONTABILIDAD],
      validation: this.validation.idParams,
      handler: async ({ params, auth }) => {
        const data = await this.anularAsiento.execute(params.id, this.empresaId(auth));
        return new ApiResponse({ data, message: data.mensaje, status: Code.OK });
      },
    });

    // ─────────────────────────── Reportes ───────────────────────────
    this.httpServer.register({
      method: "get",
      url: "/contabilidad/reportes/diario",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      permisos: [Permisos.VER_CONTABILIDAD],
      validation: this.validation.libroDiario,
      handler: async ({ query, auth }) => {
        const data = await this.obtenerLibroDiario.execute({
          ...(query as Omit<Parameters<ObtenerLibroDiario["execute"]>[0], "empresaId">),
          empresaId: this.empresaId(auth),
        });
        return new ApiResponse({ data, message: "Libro diario obtenido correctamente", status: Code.OK });
      },
    });

    this.httpServer.register({
      method: "get",
      url: "/contabilidad/reportes/mayor",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      permisos: [Permisos.VER_CONTABILIDAD],
      validation: this.validation.mayorCuenta,
      handler: async ({ query, auth }) => {
        const data = await this.obtenerMayorCuenta.execute({
          ...(query as Omit<Parameters<ObtenerMayorCuenta["execute"]>[0], "empresaId">),
          empresaId: this.empresaId(auth),
        });
        return new ApiResponse({ data, message: "Mayor obtenido correctamente", status: Code.OK });
      },
    });

    this.httpServer.register({
      method: "get",
      url: "/contabilidad/reportes/sumas-y-saldos",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      permisos: [Permisos.VER_CONTABILIDAD],
      validation: this.validation.sumasYSaldos,
      handler: async ({ query, auth }) => {
        const data = await this.obtenerSumasYSaldos.execute({
          ...(query as Omit<Parameters<ObtenerSumasYSaldos["execute"]>[0], "empresaId">),
          empresaId: this.empresaId(auth),
        });
        return new ApiResponse({ data, message: "Sumas y saldos obtenido correctamente", status: Code.OK });
      },
    });

    // ─────────────────────── Importación por Excel ───────────────────────
    this.httpServer.register({
      method: "get",
      url: "/contabilidad/importar/:tipo/plantilla",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      permisos: [Permisos.VER_CONTABILIDAD],
      validation: this.validation.plantillaImportacion,
      handler: async ({ params }) => {
        const { buffer, filename } = await this.generarPlantillaImportacion.execute(
          params.tipo as TipoPlantillaImportacion,
        );
        return new FileResponse(
          buffer,
          filename,
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "attachment",
        );
      },
    });

    this.httpServer.register({
      method: "post",
      url: "/contabilidad/importar/plan-cuentas/preview",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      permisos: [Permisos.ADMINISTRAR_PLAN_CUENTAS],
      middlewares: [upload.single("archivo")],
      validation: this.validation.previsualizarImportacion,
      handler: async ({ file, auth }) => {
        if (!file) throw new ApiError("Falta el archivo (campo 'archivo')", Code.BAD_REQUEST);
        const data = await this.previsualizarImportacionPlanCuentas.execute({
          empresaId: this.empresaId(auth),
          buffer: file.buffer,
        });
        return new ApiResponse({ data, message: "Archivo procesado correctamente", status: Code.OK });
      },
    });

    this.httpServer.register({
      method: "post",
      url: "/contabilidad/importar/plan-cuentas/confirmar",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      permisos: [Permisos.ADMINISTRAR_PLAN_CUENTAS],
      validation: this.validation.confirmarImportacionPlanCuentas,
      handler: async ({ body, auth }) => {
        const { filas } = body as { filas: CuentaAImportar[] };
        const data = await this.confirmarImportacionPlanCuentas.execute({
          empresaId: this.empresaId(auth),
          filas,
        });
        return new ApiResponse({
          data,
          message: `Se crearon ${data.creadas} cuentas${data.omitidas > 0 ? ` (${data.omitidas} omitidas)` : ""}`,
          status: Code.CREATED,
        });
      },
    });

    this.httpServer.register({
      method: "post",
      url: "/contabilidad/importar/asientos/preview",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      permisos: [Permisos.VER_CONTABILIDAD],
      middlewares: [upload.single("archivo")],
      validation: this.validation.previsualizarImportacion,
      handler: async ({ file, auth }) => {
        if (!file) throw new ApiError("Falta el archivo (campo 'archivo')", Code.BAD_REQUEST);
        const data = await this.previsualizarImportacionAsientos.execute({
          empresaId: this.empresaId(auth),
          buffer: file.buffer,
        });
        return new ApiResponse({ data, message: "Archivo procesado correctamente", status: Code.OK });
      },
    });

    this.httpServer.register({
      method: "post",
      url: "/contabilidad/importar/asientos/confirmar",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      permisos: [Permisos.VER_CONTABILIDAD],
      validation: this.validation.confirmarImportacionAsientos,
      handler: async ({ body, auth }) => {
        const { asientos, confirmar } = body as { asientos: AsientoAImportar[]; confirmar: boolean };
        const data = await this.confirmarImportacionAsientos.execute({
          empresaId: this.empresaId(auth),
          asientos,
          confirmar,
        });
        return new ApiResponse({
          data,
          message: `Se crearon ${data.creados} asientos${data.fallidos > 0 ? ` (${data.fallidos} con error)` : ""}`,
          status: Code.CREATED,
        });
      },
    });

    this.httpServer.register({
      method: "post",
      url: "/contabilidad/importar/saldos-iniciales/preview",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      permisos: [Permisos.VER_CONTABILIDAD],
      middlewares: [upload.single("archivo")],
      validation: this.validation.previsualizarImportacion,
      handler: async ({ file, auth }) => {
        if (!file) throw new ApiError("Falta el archivo (campo 'archivo')", Code.BAD_REQUEST);
        const data = await this.previsualizarImportacionSaldosIniciales.execute({
          empresaId: this.empresaId(auth),
          buffer: file.buffer,
        });
        return new ApiResponse({ data, message: "Archivo procesado correctamente", status: Code.OK });
      },
    });

    // ─────────────────── Reglas de asiento (fase 2) ───────────────────
    this.httpServer.register({
      method: "get",
      url: "/contabilidad/reglas-asiento/eventos",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      permisos: [Permisos.VER_CONTABILIDAD],
      handler: async () => {
        const data = Object.values(EventoAsiento).map((evento) => ({
          evento,
          etiqueta: EVENTOS_ASIENTO_LABELS[evento],
          expresiones: EXPRESIONES_POR_EVENTO[evento],
          auxiliares: AUXILIARES_POR_EVENTO[evento],
        }));
        return new ApiResponse({ data, message: "Eventos obtenidos correctamente", status: Code.OK });
      },
    });

    this.httpServer.register({
      method: "get",
      url: "/contabilidad/reglas-asiento",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      permisos: [Permisos.VER_CONTABILIDAD],
      handler: async ({ auth }) => {
        const data = await this.listarReglasAsiento.execute(this.empresaId(auth));
        return new ApiResponse({ data, message: "Reglas de asiento obtenidas correctamente", status: Code.OK });
      },
    });

    this.httpServer.register({
      method: "post",
      url: "/contabilidad/reglas-asiento",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      permisos: [Permisos.ADMINISTRAR_REGLAS_ASIENTO],
      validation: this.validation.crearReglaAsiento,
      handler: async ({ body, auth }) => {
        const data = await this.crearReglaAsiento.execute({
          ...(body as Omit<Parameters<CrearReglaAsiento["execute"]>[0], "empresaId">),
          empresaId: this.empresaId(auth),
        });
        return new ApiResponse({ data, message: "Regla de asiento creada correctamente", status: Code.CREATED });
      },
    });

    this.httpServer.register({
      method: "patch",
      url: "/contabilidad/reglas-asiento/:id",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      permisos: [Permisos.ADMINISTRAR_REGLAS_ASIENTO],
      validation: this.validation.actualizarReglaAsiento,
      handler: async ({ params, body, auth }) => {
        const data = await this.actualizarReglaAsiento.execute(params.id, this.empresaId(auth), body as never);
        return new ApiResponse({ data, message: "Regla de asiento actualizada correctamente", status: Code.OK });
      },
    });

    this.httpServer.register({
      method: "delete",
      url: "/contabilidad/reglas-asiento/:id",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      permisos: [Permisos.ADMINISTRAR_REGLAS_ASIENTO],
      validation: this.validation.idParams,
      handler: async ({ params, auth }) => {
        await this.eliminarReglaAsiento.execute(params.id, this.empresaId(auth));
        return new ApiResponse({ data: null, message: "Regla de asiento eliminada correctamente", status: Code.OK });
      },
    });
  }
}
