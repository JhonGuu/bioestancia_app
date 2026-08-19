import { Container } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { InformesComprasController } from "@/modules/informes-compras/infra/http/informes-compras.controller";
import { ObtenerRentabilidadTropas } from "@/modules/informes-compras/use-cases/obtener-rentabilidad-tropas.use-case";

/**
 * Depende de `compras`, `liquidacion-compra`, `liquidacion-faena` y `ventas`
 * (sus repositorios) — debe registrarse DESPUÉS de todos esos en `di.ts`. No
 * tiene repositorio propio (no hay tabla nueva): compone datos de los otros
 * módulos al vuelo, mismo criterio que `cuenta-corriente`.
 */
export function registerInformesComprasModule(container: Container): void {
  container.bind(DI_TYPES.ObtenerRentabilidadTropas).to(ObtenerRentabilidadTropas);
  container.bind(DI_TYPES.InformesComprasController).to(InformesComprasController);
  container.get(DI_TYPES.InformesComprasController);
}
