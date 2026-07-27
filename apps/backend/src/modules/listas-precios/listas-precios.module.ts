import { Container } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ListaDePreciosController } from "@/modules/listas-precios/infra/http/lista-de-precios.controller";
import { ListaDePreciosValidation } from "@/modules/listas-precios/infra/http/validation";
import { ListaDePreciosRepositoryDrizzle } from "@/modules/listas-precios/infra/repository/lista-de-precios.repository";
import { CreateListaDePrecios } from "@/modules/listas-precios/use-cases/create-lista-de-precios.use-case";
import { ListListasDePrecios } from "@/modules/listas-precios/use-cases/list-listas-de-precios.use-case";
import { GetListaDePrecios } from "@/modules/listas-precios/use-cases/get-lista-de-precios.use-case";

export function registerListasPreciosModule(container: Container): void {
  container.bind(DI_TYPES.ListaDePreciosValidation).to(ListaDePreciosValidation);
  container.bind(DI_TYPES.ListaDePreciosRepository).to(ListaDePreciosRepositoryDrizzle);
  container.bind(DI_TYPES.CreateListaDePrecios).to(CreateListaDePrecios);
  container.bind(DI_TYPES.ListListasDePrecios).to(ListListasDePrecios);
  container.bind(DI_TYPES.GetListaDePrecios).to(GetListaDePrecios);
  container.bind(DI_TYPES.ListaDePreciosController).to(ListaDePreciosController);
  container.get(DI_TYPES.ListaDePreciosController);
}
