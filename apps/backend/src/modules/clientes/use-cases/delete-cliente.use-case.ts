import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ClienteRepository } from "@/modules/clientes/domain/cliente.repository";

export interface DeleteClienteInput {
  id: string;
  empresaId: string;
}

/** Soft-delete — ver comentario en `ClienteRepository.delete()`. El 404 lo tira el repositorio. */
@injectable()
export class DeleteCliente {
  constructor(
    @inject(DI_TYPES.ClienteRepository) private readonly clienteRepository: ClienteRepository,
  ) {}

  async execute(input: DeleteClienteInput): Promise<void> {
    await this.clienteRepository.delete(input.id, input.empresaId);
  }
}
