import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { CobroConLineas, CobroRepository } from "@/modules/cobros/domain/cobro.repository";

export interface ListCobrosInput {
  empresaId: string;
  clienteId?: string;
}

@injectable()
export class ListCobros {
  constructor(@inject(DI_TYPES.CobroRepository) private readonly cobroRepository: CobroRepository) {}

  async execute(input: ListCobrosInput): Promise<CobroConLineas[]> {
    return this.cobroRepository.list(input.empresaId, input.clienteId);
  }
}
