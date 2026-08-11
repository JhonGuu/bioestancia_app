import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { Cliente } from "@/modules/clientes/domain/cliente";
import { ClienteRepository, UpdateClienteInput } from "@/modules/clientes/domain/cliente.repository";

export type UpdateClienteUseCaseInput = UpdateClienteInput & {
  id: string;
  empresaId: string;
};

/** El 404 (si no existe o no es de esta empresa) lo tira el repositorio, ver `update()`. */
@injectable()
export class UpdateCliente {
  constructor(
    @inject(DI_TYPES.ClienteRepository) private readonly clienteRepository: ClienteRepository,
  ) {}

  async execute(input: UpdateClienteUseCaseInput): Promise<Cliente> {
    const { id, empresaId, ...rest } = input;
    return this.clienteRepository.update(id, empresaId, rest);
  }
}
