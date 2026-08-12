import { Container } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ChequeController } from "@/modules/cheques/infra/http/cheque.controller";
import { ChequeValidation } from "@/modules/cheques/infra/http/validation";
import { ChequeRepositoryDrizzle } from "@/modules/cheques/infra/repository/cheque.repository";
import { ListCheques } from "@/modules/cheques/use-cases/list-cheques.use-case";
import { GetCheque } from "@/modules/cheques/use-cases/get-cheque.use-case";
import { ActualizarEstadoCheque } from "@/modules/cheques/use-cases/actualizar-estado-cheque.use-case";

export function registerChequesModule(container: Container): void {
  container.bind(DI_TYPES.ChequeValidation).to(ChequeValidation);
  container.bind(DI_TYPES.ChequeRepository).to(ChequeRepositoryDrizzle);
  container.bind(DI_TYPES.ListCheques).to(ListCheques);
  container.bind(DI_TYPES.GetCheque).to(GetCheque);
  container.bind(DI_TYPES.ActualizarEstadoCheque).to(ActualizarEstadoCheque);
  container.bind(DI_TYPES.ChequeController).to(ChequeController);
  container.get(DI_TYPES.ChequeController);
}
