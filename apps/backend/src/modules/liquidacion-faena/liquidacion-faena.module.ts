import { Container } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { LiquidacionFaenaController } from "@/modules/liquidacion-faena/infra/http/liquidacion-faena.controller";
import { LiquidacionFaenaValidation } from "@/modules/liquidacion-faena/infra/http/validation";
import { LiquidacionFaenaRepositoryDrizzle } from "@/modules/liquidacion-faena/infra/repository/liquidacion-faena.repository";
import { CreateLiquidacionFaena } from "@/modules/liquidacion-faena/use-cases/create-liquidacion-faena.use-case";
import { GetLiquidacionFaena } from "@/modules/liquidacion-faena/use-cases/get-liquidacion-faena.use-case";

/**
 * Depende de `compras` (CompraRepository + CompraCategoriaRepository) — debe
 * registrarse DESPUÉS de `registerComprasModule` en `di.ts`. No depende de
 * `resultado-faena` (son independientes entre sí, ambos parten de la compra).
 */
export function registerLiquidacionFaenaModule(container: Container): void {
  container.bind(DI_TYPES.LiquidacionFaenaValidation).to(LiquidacionFaenaValidation);
  container.bind(DI_TYPES.LiquidacionFaenaRepository).to(LiquidacionFaenaRepositoryDrizzle);
  container.bind(DI_TYPES.CreateLiquidacionFaena).to(CreateLiquidacionFaena);
  container.bind(DI_TYPES.GetLiquidacionFaena).to(GetLiquidacionFaena);
  container.bind(DI_TYPES.LiquidacionFaenaController).to(LiquidacionFaenaController);
  container.get(DI_TYPES.LiquidacionFaenaController);
}
