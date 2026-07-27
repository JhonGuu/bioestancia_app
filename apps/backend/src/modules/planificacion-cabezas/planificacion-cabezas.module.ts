import { Container } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { PlanificacionCabezasController } from "@/modules/planificacion-cabezas/infra/http/planificacion-cabezas.controller";
import { PlanificacionCabezasValidation } from "@/modules/planificacion-cabezas/infra/http/validation";
import { PlanificacionCabezasRepositoryDrizzle } from "@/modules/planificacion-cabezas/infra/repository/planificacion-cabezas.repository";
import { UpsertPlanificacionCabezas } from "@/modules/planificacion-cabezas/use-cases/upsert-planificacion-cabezas.use-case";
import { ListPlanificacionCabezas } from "@/modules/planificacion-cabezas/use-cases/list-planificacion-cabezas.use-case";

/**
 * Depende de `ClienteRepository` (módulo `clientes`) y `VentaRepository`
 * (módulo `ventas`) — debe registrarse DESPUÉS de ambos en `di.ts`.
 */
export function registerPlanificacionCabezasModule(container: Container): void {
  container.bind(DI_TYPES.PlanificacionCabezasValidation).to(PlanificacionCabezasValidation);
  container.bind(DI_TYPES.PlanificacionCabezasRepository).to(PlanificacionCabezasRepositoryDrizzle);
  container.bind(DI_TYPES.UpsertPlanificacionCabezas).to(UpsertPlanificacionCabezas);
  container.bind(DI_TYPES.ListPlanificacionCabezas).to(ListPlanificacionCabezas);
  container.bind(DI_TYPES.PlanificacionCabezasController).to(PlanificacionCabezasController);
  container.get(DI_TYPES.PlanificacionCabezasController);
}
