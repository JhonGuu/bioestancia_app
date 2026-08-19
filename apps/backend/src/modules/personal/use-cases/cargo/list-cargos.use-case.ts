import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { Cargo } from "@/modules/personal/domain/cargo";
import { CargoRepository, EstadoCargoFiltro } from "@/modules/personal/domain/cargo.repository";

export interface ListCargosInput {
  empresaId: string;
  estado?: EstadoCargoFiltro;
}

@injectable()
export class ListCargos {
  constructor(@inject(DI_TYPES.CargoRepository) private readonly cargoRepository: CargoRepository) {}

  async execute(input: ListCargosInput): Promise<Cargo[]> {
    return this.cargoRepository.list(input.empresaId, input.estado);
  }
}
