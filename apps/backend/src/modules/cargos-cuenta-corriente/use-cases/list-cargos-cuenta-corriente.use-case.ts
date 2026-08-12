import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { CargoCuentaCorriente } from "@/modules/cargos-cuenta-corriente/domain/cargo-cuenta-corriente";
import { CargoCuentaCorrienteRepository } from "@/modules/cargos-cuenta-corriente/domain/cargo-cuenta-corriente.repository";

export interface ListCargosCuentaCorrienteInput {
  empresaId: string;
  clienteId?: string;
}

@injectable()
export class ListCargosCuentaCorriente {
  constructor(
    @inject(DI_TYPES.CargoCuentaCorrienteRepository)
    private readonly cargoCuentaCorrienteRepository: CargoCuentaCorrienteRepository,
  ) {}

  async execute(input: ListCargosCuentaCorrienteInput): Promise<CargoCuentaCorriente[]> {
    return this.cargoCuentaCorrienteRepository.list(input.empresaId, input.clienteId);
  }
}
