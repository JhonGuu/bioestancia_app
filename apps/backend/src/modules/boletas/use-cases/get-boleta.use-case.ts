import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { Boleta } from "@/modules/boletas/domain/boleta";
import { BoletaRepository } from "@/modules/boletas/domain/boleta.repository";

export interface GetBoletaInput {
  id: string;
  empresaId: string;
}

@injectable()
export class GetBoleta {
  constructor(@inject(DI_TYPES.BoletaRepository) private readonly boletaRepository: BoletaRepository) {}

  async execute(input: GetBoletaInput): Promise<Boleta> {
    const boleta = await this.boletaRepository.getById(input.id, input.empresaId);
    if (!boleta) {
      throw new ApiError("Boleta no encontrada", Code.NOT_FOUND);
    }
    return boleta;
  }
}
