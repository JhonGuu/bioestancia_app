import { Container } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { BoletaController } from "@/modules/boletas/infra/http/boleta.controller";
import { BoletaValidation } from "@/modules/boletas/infra/http/validation";
import { BoletaRepositoryDrizzle } from "@/modules/boletas/infra/repository/boleta.repository";
import { CreateBoleta } from "@/modules/boletas/use-cases/create-boleta.use-case";
import { ListBoletas } from "@/modules/boletas/use-cases/list-boletas.use-case";
import { GetBoleta } from "@/modules/boletas/use-cases/get-boleta.use-case";

export function registerBoletasModule(container: Container): void {
  container.bind(DI_TYPES.BoletaValidation).to(BoletaValidation);
  container.bind(DI_TYPES.BoletaRepository).to(BoletaRepositoryDrizzle);
  container.bind(DI_TYPES.CreateBoleta).to(CreateBoleta);
  container.bind(DI_TYPES.ListBoletas).to(ListBoletas);
  container.bind(DI_TYPES.GetBoleta).to(GetBoleta);
  container.bind(DI_TYPES.BoletaController).to(BoletaController);
  container.get(DI_TYPES.BoletaController);
}
