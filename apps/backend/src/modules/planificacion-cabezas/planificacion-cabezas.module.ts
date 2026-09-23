import { Container } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { PlanificacionCabezasController } from "@/modules/planificacion-cabezas/infra/http/planificacion-cabezas.controller";
import { PlanificacionCabezasValidation } from "@/modules/planificacion-cabezas/infra/http/validation";
import { PlanificacionCabezasRepositoryDrizzle } from "@/modules/planificacion-cabezas/infra/repository/planificacion-cabezas.repository";
import { UpsertPlanificacionCabezas } from "@/modules/planificacion-cabezas/use-cases/upsert-planificacion-cabezas.use-case";
import { ListPlanificacionCabezas } from "@/modules/planificacion-cabezas/use-cases/list-planificacion-cabezas.use-case";
import { ObtenerRepartoDiario } from "@/modules/planificacion-cabezas/use-cases/obtener-reparto-diario.use-case";
import { GenerarRepartoDiarioPdf } from "@/modules/planificacion-cabezas/use-cases/generar-reparto-diario-pdf.use-case";
import { RepartoDiarioPdfGenerator } from "@/shared/infra/documents/reparto-diario-pdf.generator";

/**
 * Depende de `ClienteRepository` (módulo `clientes`), `VentaRepository`
 * (módulo `ventas`) y `EmpresaRepository` (módulo `empresas`, para el
 * reparto diario) — debe registrarse DESPUÉS de los tres en `di.ts`.
 */
export function registerPlanificacionCabezasModule(container: Container): void {
  container.bind(DI_TYPES.PlanificacionCabezasValidation).to(PlanificacionCabezasValidation);
  container.bind(DI_TYPES.PlanificacionCabezasRepository).to(PlanificacionCabezasRepositoryDrizzle);
  container.bind(DI_TYPES.UpsertPlanificacionCabezas).to(UpsertPlanificacionCabezas);
  container.bind(DI_TYPES.ListPlanificacionCabezas).to(ListPlanificacionCabezas);
  container.bind(DI_TYPES.RepartoDiarioPdfGenerator).to(RepartoDiarioPdfGenerator);
  container.bind(DI_TYPES.ObtenerRepartoDiario).to(ObtenerRepartoDiario);
  container.bind(DI_TYPES.GenerarRepartoDiarioPdf).to(GenerarRepartoDiarioPdf);
  container.bind(DI_TYPES.PlanificacionCabezasController).to(PlanificacionCabezasController);
  container.get(DI_TYPES.PlanificacionCabezasController);
}
