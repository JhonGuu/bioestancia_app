import { Container } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ResultadoFaenaController } from "@/modules/resultado-faena/infra/http/resultado-faena.controller";
import { ResultadoFaenaValidation } from "@/modules/resultado-faena/infra/http/validation";
import { ResultadoFaenaRepositoryDrizzle } from "@/modules/resultado-faena/infra/repository/resultado-faena.repository";
import { CreateResultadoFaena } from "@/modules/resultado-faena/use-cases/create-resultado-faena.use-case";
import { GetResultadoFaena } from "@/modules/resultado-faena/use-cases/get-resultado-faena.use-case";

/**
 * Depende de `compras` (CompraRepository + CompraCategoriaRepository) — debe
 * registrarse DESPUÉS de `registerComprasModule` en `di.ts`.
 */
export function registerResultadoFaenaModule(container: Container): void {
  container.bind(DI_TYPES.ResultadoFaenaValidation).to(ResultadoFaenaValidation);
  container.bind(DI_TYPES.ResultadoFaenaRepository).to(ResultadoFaenaRepositoryDrizzle);
  container.bind(DI_TYPES.CreateResultadoFaena).to(CreateResultadoFaena);
  container.bind(DI_TYPES.GetResultadoFaena).to(GetResultadoFaena);
  container.bind(DI_TYPES.ResultadoFaenaController).to(ResultadoFaenaController);
  container.get(DI_TYPES.ResultadoFaenaController);
}
