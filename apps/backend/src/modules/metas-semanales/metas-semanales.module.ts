import { Container } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { MetasSemanalesController } from "@/modules/metas-semanales/infra/http/metas-semanales.controller";
import { MetasSemanalesValidation } from "@/modules/metas-semanales/infra/http/validation";
import { ObtenerProgresoMetasSemanales } from "@/modules/metas-semanales/use-cases/obtener-progreso-metas-semanales.use-case";

/**
 * No tiene tabla ni repositorio propio — agrega `clientes` + `ventas` al
 * vuelo (mismo criterio que `modules/cuenta-corriente`). Depende de ambos —
 * debe registrarse DESPUÉS en `di.ts`.
 */
export function registerMetasSemanalesModule(container: Container): void {
  container.bind(DI_TYPES.MetasSemanalesValidation).to(MetasSemanalesValidation);
  container.bind(DI_TYPES.ObtenerProgresoMetasSemanales).to(ObtenerProgresoMetasSemanales);
  container.bind(DI_TYPES.MetasSemanalesController).to(MetasSemanalesController);
  container.get(DI_TYPES.MetasSemanalesController);
}
