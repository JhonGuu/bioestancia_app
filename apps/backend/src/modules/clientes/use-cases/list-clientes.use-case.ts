import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { Cliente } from "@/modules/clientes/domain/cliente";
import { ClienteRepository } from "@/modules/clientes/domain/cliente.repository";

export interface ListClientesInput {
  empresaId: string;
}

@injectable()
export class ListClientes {
  constructor(
    @inject(DI_TYPES.ClienteRepository) private readonly clienteRepository: ClienteRepository,
  ) {}

  async execute(input: ListClientesInput): Promise<Cliente[]> {
    return this.clienteRepository.list(input.empresaId);
  }
}
