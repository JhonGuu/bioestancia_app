import { Container } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { CabezasController } from "@/modules/cabezas/infra/http/cabezas.controller";
import { CabezasValidation } from "@/modules/cabezas/infra/http/validation";
import { ObtenerInformeCabezas } from "@/modules/cabezas/use-cases/obtener-informe-cabezas.use-case";

/**
 * No tiene tabla ni repositorio propio — es una capa de agregación pura
 * sobre `clientes`, `ventas` y `planificacion_cabezas` (ver
 * `ObtenerInformeCabezas`). Debe registrarse DESPUÉS de esos tres módulos en
 * `di.ts` — mismo criterio que `registerInformeCobranzasModule`.
 */
export function registerCabezasModule(container: Container): void {
  container.bind(DI_TYPES.CabezasValidation).to(CabezasValidation);
  container.bind(DI_TYPES.ObtenerInformeCabezas).to(ObtenerInformeCabezas);
  container.bind(DI_TYPES.CabezasController).to(CabezasController);
  container.get(DI_TYPES.CabezasController);
}
