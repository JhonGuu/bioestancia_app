import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { ClienteFinal } from "@/modules/clientes/domain/cliente-final";
import {
  ClienteFinalRepository,
  CreateClienteFinalInput,
} from "@/modules/clientes/domain/cliente-final.repository";
import { ClienteRepository } from "@/modules/clientes/domain/cliente.repository";

/**
 * Crea un destino de reventa para un cliente revendedor. Valida que el
 * cliente exista, sea de esta empresa, Y esté marcado `esRevendedor` — este
 * catálogo no tiene sentido para un cliente que no revende.
 */
@injectable()
export class CreateClienteFinal {
  constructor(
    @inject(DI_TYPES.ClienteFinalRepository)
    private readonly clienteFinalRepository: ClienteFinalRepository,
    @inject(DI_TYPES.ClienteRepository) private readonly clienteRepository: ClienteRepository,
  ) {}

  async execute(input: CreateClienteFinalInput): Promise<ClienteFinal> {
    const cliente = await this.clienteRepository.getById(input.clienteId, input.empresaId);
    if (!cliente) {
      throw new ApiError("El cliente no existe (o no es de esta empresa)", Code.BAD_REQUEST);
    }
    if (!cliente.esRevendedor) {
      throw new ApiError("Este cliente no está marcado como revendedor", Code.BAD_REQUEST);
    }
    return this.clienteFinalRepository.create(input);
  }
}
