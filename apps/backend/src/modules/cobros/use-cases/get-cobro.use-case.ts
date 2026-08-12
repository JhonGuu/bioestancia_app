import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { CobroConLineas, CobroRepository } from "@/modules/cobros/domain/cobro.repository";

export interface GetCobroInput {
  id: string;
  empresaId: string;
}

@injectable()
export class GetCobro {
  constructor(@inject(DI_TYPES.CobroRepository) private readonly cobroRepository: CobroRepository) {}

  async execute(input: GetCobroInput): Promise<CobroConLineas> {
    const cobro = await this.cobroRepository.getById(input.id, input.empresaId);
    if (!cobro) {
      throw new ApiError("Cobro no encontrado", Code.NOT_FOUND);
    }
    return cobro;
  }
}
