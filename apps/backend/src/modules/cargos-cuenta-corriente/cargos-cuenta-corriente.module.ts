import { Container } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { CargoCuentaCorrienteController } from "@/modules/cargos-cuenta-corriente/infra/http/cargo-cuenta-corriente.controller";
import { CargoCuentaCorrienteValidation } from "@/modules/cargos-cuenta-corriente/infra/http/validation";
import { CargoCuentaCorrienteRepositoryDrizzle } from "@/modules/cargos-cuenta-corriente/infra/repository/cargo-cuenta-corriente.repository";
import { CreateCargoCuentaCorriente } from "@/modules/cargos-cuenta-corriente/use-cases/create-cargo-cuenta-corriente.use-case";
import { ListCargosCuentaCorriente } from "@/modules/cargos-cuenta-corriente/use-cases/list-cargos-cuenta-corriente.use-case";

/**
 * Depende de `clientes` (ClienteRepository) y referencia la tabla `cheques`
 * en su schema (`chequeId`, nullable) — debe registrarse después de
 * `clientes` y `cheques`. `cobros` depende de ESTE módulo (confirma
 * recargo/comisión), así que va antes de `cobros` en `di.ts`.
 */
export function registerCargosCuentaCorrienteModule(container: Container): void {
  container.bind(DI_TYPES.CargoCuentaCorrienteValidation).to(CargoCuentaCorrienteValidation);
  container.bind(DI_TYPES.CargoCuentaCorrienteRepository).to(CargoCuentaCorrienteRepositoryDrizzle);
  container.bind(DI_TYPES.CreateCargoCuentaCorriente).to(CreateCargoCuentaCorriente);
  container.bind(DI_TYPES.ListCargosCuentaCorriente).to(ListCargosCuentaCorriente);
  container.bind(DI_TYPES.CargoCuentaCorrienteController).to(CargoCuentaCorrienteController);
  container.get(DI_TYPES.CargoCuentaCorrienteController);
}
