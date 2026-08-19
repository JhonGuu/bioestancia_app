import { Container } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { CargoController } from "@/modules/personal/infra/http/cargo.controller";
import { CargoValidation } from "@/modules/personal/infra/http/cargo.validation";
import { EmpleadoController } from "@/modules/personal/infra/http/empleado.controller";
import { EmpleadoValidation } from "@/modules/personal/infra/http/empleado.validation";
import { CargoRepositoryDrizzle } from "@/modules/personal/infra/repository/cargo.repository";
import { EmpleadoRepositoryDrizzle } from "@/modules/personal/infra/repository/empleado.repository";
import { HorarioEmpleadoRepositoryDrizzle } from "@/modules/personal/infra/repository/horario-empleado.repository";
import { CreateCargo } from "@/modules/personal/use-cases/cargo/create-cargo.use-case";
import { ListCargos } from "@/modules/personal/use-cases/cargo/list-cargos.use-case";
import { GetCargo } from "@/modules/personal/use-cases/cargo/get-cargo.use-case";
import { UpdateCargo } from "@/modules/personal/use-cases/cargo/update-cargo.use-case";
import { DeleteCargo } from "@/modules/personal/use-cases/cargo/delete-cargo.use-case";
import { ReactivarCargo } from "@/modules/personal/use-cases/cargo/reactivar-cargo.use-case";
import { CreateEmpleado } from "@/modules/personal/use-cases/empleado/create-empleado.use-case";
import { ListEmpleados } from "@/modules/personal/use-cases/empleado/list-empleados.use-case";
import { GetEmpleado } from "@/modules/personal/use-cases/empleado/get-empleado.use-case";
import { UpdateEmpleado } from "@/modules/personal/use-cases/empleado/update-empleado.use-case";
import { DeleteEmpleado } from "@/modules/personal/use-cases/empleado/delete-empleado.use-case";
import { ReactivarEmpleado } from "@/modules/personal/use-cases/empleado/reactivar-empleado.use-case";
import { SubirDniEmpleado } from "@/modules/personal/use-cases/empleado/subir-dni-empleado.use-case";
import { DescargarDniEmpleado } from "@/modules/personal/use-cases/empleado/descargar-dni-empleado.use-case";
import { ListHorariosEmpleado } from "@/modules/personal/use-cases/horario-empleado/list-horarios-empleado.use-case";
import { SetHorariosEmpleado } from "@/modules/personal/use-cases/horario-empleado/set-horarios-empleado.use-case";
import { FichajeController } from "@/modules/personal/infra/http/fichaje.controller";
import { FichajeValidation } from "@/modules/personal/infra/http/fichaje.validation";
import { FichajeRepositoryDrizzle } from "@/modules/personal/infra/repository/fichaje.repository";
import { PrevisualizarImportacionFichajes } from "@/modules/personal/use-cases/fichaje/previsualizar-importacion-fichajes.use-case";
import { ConfirmarImportacionFichajes } from "@/modules/personal/use-cases/fichaje/confirmar-importacion-fichajes.use-case";
import { AgregarFichajeManual } from "@/modules/personal/use-cases/fichaje/agregar-fichaje-manual.use-case";
import { JornadaController } from "@/modules/personal/infra/http/jornada.controller";
import { JornadaValidation } from "@/modules/personal/infra/http/jornada.validation";
import { CalcularJornadasEmpleado } from "@/modules/personal/use-cases/jornada/calcular-jornadas-empleado.use-case";
import { BalanceHorasController } from "@/modules/personal/infra/http/balance-horas.controller";
import { BalanceHorasValidation } from "@/modules/personal/infra/http/balance-horas.validation";
import { CalcularBalanceHoras } from "@/modules/personal/use-cases/balance-horas/calcular-balance-horas.use-case";

/**
 * Módulo `personal`: Cargo (catálogo de puestos), Empleado (legajo) y
 * HorarioEmpleado (sub-recurso). Fase 2 de `docs/plan-personal-asistencia.md`.
 *
 * No depende de otros módulos de negocio — solo de `DBConnection` y
 * `FileStorage` (ambos bindeados en `registerSharedInfra`, ver `di.ts`).
 */
export function registerPersonalModule(container: Container): void {
  // Validations
  container.bind(DI_TYPES.CargoValidation).to(CargoValidation);
  container.bind(DI_TYPES.EmpleadoValidation).to(EmpleadoValidation);
  container.bind(DI_TYPES.FichajeValidation).to(FichajeValidation);
  container.bind(DI_TYPES.JornadaValidation).to(JornadaValidation);
  container.bind(DI_TYPES.BalanceHorasValidation).to(BalanceHorasValidation);

  // Repositories
  container.bind(DI_TYPES.CargoRepository).to(CargoRepositoryDrizzle);
  container.bind(DI_TYPES.EmpleadoRepository).to(EmpleadoRepositoryDrizzle);
  container.bind(DI_TYPES.HorarioEmpleadoRepository).to(HorarioEmpleadoRepositoryDrizzle);
  container.bind(DI_TYPES.FichajeRepository).to(FichajeRepositoryDrizzle);

  // Use-cases: Cargo
  container.bind(DI_TYPES.CreateCargo).to(CreateCargo);
  container.bind(DI_TYPES.ListCargos).to(ListCargos);
  container.bind(DI_TYPES.GetCargo).to(GetCargo);
  container.bind(DI_TYPES.UpdateCargo).to(UpdateCargo);
  container.bind(DI_TYPES.DeleteCargo).to(DeleteCargo);
  container.bind(DI_TYPES.ReactivarCargo).to(ReactivarCargo);

  // Use-cases: Empleado
  container.bind(DI_TYPES.CreateEmpleado).to(CreateEmpleado);
  container.bind(DI_TYPES.ListEmpleados).to(ListEmpleados);
  container.bind(DI_TYPES.GetEmpleado).to(GetEmpleado);
  container.bind(DI_TYPES.UpdateEmpleado).to(UpdateEmpleado);
  container.bind(DI_TYPES.DeleteEmpleado).to(DeleteEmpleado);
  container.bind(DI_TYPES.ReactivarEmpleado).to(ReactivarEmpleado);
  container.bind(DI_TYPES.SubirDniEmpleado).to(SubirDniEmpleado);
  container.bind(DI_TYPES.DescargarDniEmpleado).to(DescargarDniEmpleado);

  // Use-cases: HorarioEmpleado
  container.bind(DI_TYPES.ListHorariosEmpleado).to(ListHorariosEmpleado);
  container.bind(DI_TYPES.SetHorariosEmpleado).to(SetHorariosEmpleado);

  // Use-cases: Fichaje (importación)
  container.bind(DI_TYPES.PrevisualizarImportacionFichajes).to(PrevisualizarImportacionFichajes);
  container.bind(DI_TYPES.ConfirmarImportacionFichajes).to(ConfirmarImportacionFichajes);
  container.bind(DI_TYPES.AgregarFichajeManual).to(AgregarFichajeManual);

  // Use-cases: Jornada (asistencia)
  container.bind(DI_TYPES.CalcularJornadasEmpleado).to(CalcularJornadasEmpleado);

  // Use-cases: Balance de horas extra
  container.bind(DI_TYPES.CalcularBalanceHoras).to(CalcularBalanceHoras);

  // Controllers (instanciados eagerly para que registren sus rutas)
  container.bind(DI_TYPES.CargoController).to(CargoController);
  container.get(DI_TYPES.CargoController);
  container.bind(DI_TYPES.EmpleadoController).to(EmpleadoController);
  container.get(DI_TYPES.EmpleadoController);
  container.bind(DI_TYPES.FichajeController).to(FichajeController);
  container.get(DI_TYPES.FichajeController);
  container.bind(DI_TYPES.JornadaController).to(JornadaController);
  container.get(DI_TYPES.JornadaController);
  container.bind(DI_TYPES.BalanceHorasController).to(BalanceHorasController);
  container.get(DI_TYPES.BalanceHorasController);
}
