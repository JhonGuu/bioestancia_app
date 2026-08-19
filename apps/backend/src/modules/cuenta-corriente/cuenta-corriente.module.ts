import { Container } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { CuentaCorrienteController } from "@/modules/cuenta-corriente/infra/http/cuenta-corriente.controller";
import { CuentaCorrienteValidation } from "@/modules/cuenta-corriente/infra/http/validation";
import { ObtenerSaldoCliente } from "@/modules/cuenta-corriente/use-cases/obtener-saldo-cliente.use-case";
import { ObtenerSaldosClientes } from "@/modules/cuenta-corriente/use-cases/obtener-saldos-clientes.use-case";
import { ObtenerMovimientosCuentaCorriente } from "@/modules/cuenta-corriente/use-cases/obtener-movimientos-cuenta-corriente.use-case";
import { ObtenerResumenCuentaData } from "@/modules/cuenta-corriente/use-cases/obtener-resumen-cuenta-data.use-case";
import { GenerarResumenCuentaPdf } from "@/modules/cuenta-corriente/use-cases/generar-resumen-cuenta-pdf.use-case";
import { GenerarResumenCuentaExcel } from "@/modules/cuenta-corriente/use-cases/generar-resumen-cuenta-excel.use-case";

/**
 * No tiene tabla ni repositorio propio — es una capa de agregación pura
 * sobre `clientes`, `boletas`, `ventas`, `cobros`, y `cargos-cuenta-corriente`
 * (ver los use-cases). Depende de los cinco — debe registrarse DESPUÉS en
 * `di.ts`. `ObtenerResumenCuentaData` (y los generadores de PDF/Excel que
 * dependen de ella) reutiliza `ObtenerSaldoCliente`/
 * `ObtenerMovimientosCuentaCorriente` — por eso van bindeados ANTES acá abajo.
 */
export function registerCuentaCorrienteModule(container: Container): void {
  container.bind(DI_TYPES.CuentaCorrienteValidation).to(CuentaCorrienteValidation);
  container.bind(DI_TYPES.ObtenerSaldoCliente).to(ObtenerSaldoCliente);
  container.bind(DI_TYPES.ObtenerSaldosClientes).to(ObtenerSaldosClientes);
  container.bind(DI_TYPES.ObtenerMovimientosCuentaCorriente).to(ObtenerMovimientosCuentaCorriente);
  container.bind(DI_TYPES.ObtenerResumenCuentaData).to(ObtenerResumenCuentaData);
  container.bind(DI_TYPES.GenerarResumenCuentaPdf).to(GenerarResumenCuentaPdf);
  container.bind(DI_TYPES.GenerarResumenCuentaExcel).to(GenerarResumenCuentaExcel);
  container.bind(DI_TYPES.CuentaCorrienteController).to(CuentaCorrienteController);
  container.get(DI_TYPES.CuentaCorrienteController);
}
