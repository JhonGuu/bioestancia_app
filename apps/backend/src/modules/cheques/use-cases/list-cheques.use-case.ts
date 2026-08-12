import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { Cheque } from "@/modules/cheques/domain/cheque";
import { ChequeRepository, ListChequesFiltro } from "@/modules/cheques/domain/cheque.repository";

export interface ListChequesInput {
  empresaId: string;
  filtro?: ListChequesFiltro;
}

/** Lista la "cartera de cheques" de la empresa, opcionalmente filtrada por estado y/o cliente. */
@injectable()
export class ListCheques {
  constructor(@inject(DI_TYPES.ChequeRepository) private readonly chequeRepository: ChequeRepository) {}

  async execute(input: ListChequesInput): Promise<Cheque[]> {
    return this.chequeRepository.list(input.empresaId, input.filtro);
  }
}
