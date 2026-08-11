import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ClienteFinal } from "@/modules/clientes/domain/cliente-final";
import { ClienteFinalRepository } from "@/modules/clientes/domain/cliente-final.repository";

export interface ListClientesFinalesInput {
  clienteId: string;
  empresaId: string;
}

@injectable()
export class ListClientesFinales {
  constructor(
    @inject(DI_TYPES.ClienteFinalRepository)
    private readonly clienteFinalRepository: ClienteFinalRepository,
  ) {}

  async execute(input: ListClientesFinalesInput): Promise<ClienteFinal[]> {
    return this.clienteFinalRepository.listByCliente(input.clienteId, input.empresaId);
  }
}
