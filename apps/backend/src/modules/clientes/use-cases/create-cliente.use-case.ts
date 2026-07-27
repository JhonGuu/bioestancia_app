import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { Cliente } from "@/modules/clientes/domain/cliente";
import { ClienteRepository, CreateClienteInput } from "@/modules/clientes/domain/cliente.repository";

@injectable()
export class CreateCliente {
  constructor(
    @inject(DI_TYPES.ClienteRepository) private readonly clienteRepository: ClienteRepository,
  ) {}

  async execute(input: CreateClienteInput): Promise<Cliente> {
    return this.clienteRepository.create(input);
  }
}
