import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { Boleta } from "@/modules/boletas/domain/boleta";
import { BoletaRepository } from "@/modules/boletas/domain/boleta.repository";

export interface ListBoletasInput {
  empresaId: string;
}

@injectable()
export class ListBoletas {
  constructor(@inject(DI_TYPES.BoletaRepository) private readonly boletaRepository: BoletaRepository) {}

  async execute(input: ListBoletasInput): Promise<Boleta[]> {
    return this.boletaRepository.list(input.empresaId);
  }
}
