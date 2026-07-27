import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { Cliente } from "@/modules/clientes/domain/cliente";
import { ClienteRepository } from "@/modules/clientes/domain/cliente.repository";

export interface GetClienteInput {
  id: string;
  empresaId: string;
}

@injectable()
export class GetCliente {
  constructor(
    @inject(DI_TYPES.ClienteRepository) private readonly clienteRepository: ClienteRepository,
  ) {}

  async execute(input: GetClienteInput): Promise<Cliente> {
    const cliente = await this.clienteRepository.getById(input.id, input.empresaId);
    if (!cliente) {
      throw new ApiError("Cliente no encontrado", Code.NOT_FOUND);
    }
    return cliente;
  }
}
