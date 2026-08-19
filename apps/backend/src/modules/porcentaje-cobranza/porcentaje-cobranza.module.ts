import { Container } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { PorcentajeCobranzaController } from "@/modules/porcentaje-cobranza/infra/http/porcentaje-cobranza.controller";
import { PorcentajeCobranzaValidation } from "@/modules/porcentaje-cobranza/infra/http/validation";
import { ObtenerPorcentajeCobranza } from "@/modules/porcentaje-cobranza/use-cases/obtener-porcentaje-cobranza.use-case";

/**
 * No tiene tabla ni repositorio propio — agrega `clientes` + `boletas` +
 * `ventas` + `cobros` + `cargos-cuenta-corriente` al vuelo (mismo criterio
 * que `modules/cuenta-corriente` y `modules/metas-semanales`). Depende de
 * los cinco — debe registrarse DESPUÉS en `di.ts`.
 */
export function registerPorcentajeCobranzaModule(container: Container): void {
  container.bind(DI_TYPES.PorcentajeCobranzaValidation).to(PorcentajeCobranzaValidation);
  container.bind(DI_TYPES.ObtenerPorcentajeCobranza).to(ObtenerPorcentajeCobranza);
  container.bind(DI_TYPES.PorcentajeCobranzaController).to(PorcentajeCobranzaController);
  container.get(DI_TYPES.PorcentajeCobranzaController);
}
