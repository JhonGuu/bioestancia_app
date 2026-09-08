import { Container } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ContabilidadController } from "@/modules/contabilidad/infra/http/contabilidad.controller";
import { ContabilidadValidation } from "@/modules/contabilidad/infra/http/validation";
import { AsientoRepositoryDrizzle } from "@/modules/contabilidad/infra/repository/asiento.repository";
import { CentroCostoRepositoryDrizzle } from "@/modules/contabilidad/infra/repository/centro-costo.repository";
import { CuentaRepositoryDrizzle } from "@/modules/contabilidad/infra/repository/cuenta.repository";
import { EjercicioRepositoryDrizzle } from "@/modules/contabilidad/infra/repository/ejercicio.repository";
import { ListarPlanCuentas } from "@/modules/contabilidad/use-cases/listar-plan-cuentas.use-case";
import { CrearCuenta } from "@/modules/contabilidad/use-cases/crear-cuenta.use-case";
import { ActualizarCuenta } from "@/modules/contabilidad/use-cases/actualizar-cuenta.use-case";
import { EliminarCuenta } from "@/modules/contabilidad/use-cases/eliminar-cuenta.use-case";
import { SembrarPlanCuentas } from "@/modules/contabilidad/use-cases/sembrar-plan-cuentas.use-case";
import { CrearEjercicio } from "@/modules/contabilidad/use-cases/crear-ejercicio.use-case";
import { ListarEjercicios } from "@/modules/contabilidad/use-cases/listar-ejercicios.use-case";
import { CambiarEstadoEjercicio } from "@/modules/contabilidad/use-cases/cambiar-estado-ejercicio.use-case";
import { CambiarEstadoPeriodo } from "@/modules/contabilidad/use-cases/cambiar-estado-periodo.use-case";
import { ResolverContextoAsiento } from "@/modules/contabilidad/use-cases/resolver-contexto-asiento.use-case";
import { ListarAsientos } from "@/modules/contabilidad/use-cases/listar-asientos.use-case";
import { ObtenerAsiento } from "@/modules/contabilidad/use-cases/obtener-asiento.use-case";
import { CrearAsiento } from "@/modules/contabilidad/use-cases/crear-asiento.use-case";
import { ActualizarAsiento } from "@/modules/contabilidad/use-cases/actualizar-asiento.use-case";
import { ConfirmarAsiento } from "@/modules/contabilidad/use-cases/confirmar-asiento.use-case";
import { AnularAsiento } from "@/modules/contabilidad/use-cases/anular-asiento.use-case";
import { GenerarAsientoApertura } from "@/modules/contabilidad/use-cases/generar-asiento-apertura.use-case";
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
import { GenerarPlantillaImportacion } from "@/modules/contabilidad/use-cases/importar/generar-plantilla-importacion.use-case";
import { ReglaAsientoRepositoryDrizzle } from "@/modules/contabilidad/infra/repository/regla-asiento.repository";
import {
  ActualizarReglaAsiento,
  CrearReglaAsiento,
  EliminarReglaAsiento,
  ListarReglasAsiento,
} from "@/modules/contabilidad/use-cases/gestionar-reglas-asiento.use-case";
import { GenerarAsientosAutomaticos } from "@/modules/contabilidad/use-cases/generar-asientos-automaticos.use-case";

/**
 * Módulo contable (fase 1: plan de cuentas, ejercicios/períodos, asientos e
 * importación por Excel).
 *
 * La importación de saldos iniciales y de asientos resuelve el auxiliar de
 * una cuenta de control por NOMBRE contra `ClienteRepository`,
 * `ProveedorRepository` y `FrigorificoRepository` (ver
 * `resolver-auxiliar.util.ts`) — por eso, a diferencia del resto del
 * módulo, este SÍ depende de esos tres módulos de negocio, y por eso
 * `registerContabilidadModule` va después de ellos en `di.ts`.
 */
export function registerContabilidadModule(container: Container): void {
  container.bind(DI_TYPES.ContabilidadValidation).to(ContabilidadValidation);

  container.bind(DI_TYPES.CuentaRepository).to(CuentaRepositoryDrizzle);
  container.bind(DI_TYPES.CentroCostoRepository).to(CentroCostoRepositoryDrizzle);
  container.bind(DI_TYPES.EjercicioRepository).to(EjercicioRepositoryDrizzle);
  container.bind(DI_TYPES.AsientoRepository).to(AsientoRepositoryDrizzle);
  container.bind(DI_TYPES.ReglaAsientoRepository).to(ReglaAsientoRepositoryDrizzle);

  container.bind(DI_TYPES.ListarPlanCuentas).to(ListarPlanCuentas);
  container.bind(DI_TYPES.CrearCuenta).to(CrearCuenta);
  container.bind(DI_TYPES.ActualizarCuenta).to(ActualizarCuenta);
  container.bind(DI_TYPES.EliminarCuenta).to(EliminarCuenta);
  container.bind(DI_TYPES.SembrarPlanCuentas).to(SembrarPlanCuentas);

  container.bind(DI_TYPES.ListarCentrosCosto).to(ListarCentrosCosto);
  container.bind(DI_TYPES.CrearCentroCosto).to(CrearCentroCosto);
  container.bind(DI_TYPES.ActualizarCentroCosto).to(ActualizarCentroCosto);
  container.bind(DI_TYPES.EliminarCentroCosto).to(EliminarCentroCosto);

  container.bind(DI_TYPES.CrearEjercicio).to(CrearEjercicio);
  container.bind(DI_TYPES.ListarEjercicios).to(ListarEjercicios);
  container.bind(DI_TYPES.CambiarEstadoEjercicio).to(CambiarEstadoEjercicio);
  container.bind(DI_TYPES.CambiarEstadoPeriodo).to(CambiarEstadoPeriodo);

  // `ResolverContextoAsiento` va antes que los use-cases de asientos: los tres
  // que imputan (crear, actualizar, confirmar/anular) lo inyectan.
  container.bind(DI_TYPES.ResolverContextoAsiento).to(ResolverContextoAsiento);
  container.bind(DI_TYPES.ListarAsientos).to(ListarAsientos);
  container.bind(DI_TYPES.ObtenerAsiento).to(ObtenerAsiento);
  container.bind(DI_TYPES.CrearAsiento).to(CrearAsiento);
  container.bind(DI_TYPES.ActualizarAsiento).to(ActualizarAsiento);
  container.bind(DI_TYPES.ConfirmarAsiento).to(ConfirmarAsiento);
  container.bind(DI_TYPES.AnularAsiento).to(AnularAsiento);
  container.bind(DI_TYPES.GenerarAsientoApertura).to(GenerarAsientoApertura);

  container.bind(DI_TYPES.ObtenerLibroDiario).to(ObtenerLibroDiario);
  container.bind(DI_TYPES.ObtenerMayorCuenta).to(ObtenerMayorCuenta);
  container.bind(DI_TYPES.ObtenerSumasYSaldos).to(ObtenerSumasYSaldos);

  container.bind(DI_TYPES.PrevisualizarImportacionPlanCuentas).to(PrevisualizarImportacionPlanCuentas);
  container.bind(DI_TYPES.ConfirmarImportacionPlanCuentas).to(ConfirmarImportacionPlanCuentas);
  container.bind(DI_TYPES.PrevisualizarImportacionAsientos).to(PrevisualizarImportacionAsientos);
  container.bind(DI_TYPES.ConfirmarImportacionAsientos).to(ConfirmarImportacionAsientos);
  container.bind(DI_TYPES.PrevisualizarImportacionSaldosIniciales).to(PrevisualizarImportacionSaldosIniciales);
  container.bind(DI_TYPES.GenerarPlantillaImportacion).to(GenerarPlantillaImportacion);

  container.bind(DI_TYPES.ListarReglasAsiento).to(ListarReglasAsiento);
  container.bind(DI_TYPES.CrearReglaAsiento).to(CrearReglaAsiento);
  container.bind(DI_TYPES.ActualizarReglaAsiento).to(ActualizarReglaAsiento);
  container.bind(DI_TYPES.EliminarReglaAsiento).to(EliminarReglaAsiento);
  container.bind(DI_TYPES.GenerarAsientosAutomaticos).to(GenerarAsientosAutomaticos);

  container.bind(DI_TYPES.ContabilidadController).to(ContabilidadController);
  container.get(DI_TYPES.ContabilidadController);
}
