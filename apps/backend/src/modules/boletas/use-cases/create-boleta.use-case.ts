import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { Boleta } from "@/modules/boletas/domain/boleta";
import { BoletaRepository, CreateBoletaInput } from "@/modules/boletas/domain/boleta.repository";

@injectable()
export class CreateBoleta {
  constructor(@inject(DI_TYPES.BoletaRepository) private readonly boletaRepository: BoletaRepository) {}

  async execute(input: CreateBoletaInput): Promise<Boleta> {
    return this.boletaRepository.create(input);
  }
}
