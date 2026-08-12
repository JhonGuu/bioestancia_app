import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { Cheque } from "@/modules/cheques/domain/cheque";
import { ChequeRepository } from "@/modules/cheques/domain/cheque.repository";

export interface GetChequeInput {
  id: string;
  empresaId: string;
}

@injectable()
export class GetCheque {
  constructor(@inject(DI_TYPES.ChequeRepository) private readonly chequeRepository: ChequeRepository) {}

  async execute(input: GetChequeInput): Promise<Cheque> {
    const cheque = await this.chequeRepository.getById(input.id, input.empresaId);
    if (!cheque) {
      throw new ApiError("Cheque no encontrado", Code.NOT_FOUND);
    }
    return cheque;
  }
}
