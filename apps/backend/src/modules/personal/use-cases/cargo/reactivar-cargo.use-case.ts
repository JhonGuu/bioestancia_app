import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { Cargo } from "@/modules/personal/domain/cargo";
import { CargoRepository } from "@/modules/personal/domain/cargo.repository";

export interface ReactivarCargoInput {
  id: string;
  empresaId: string;
}

@injectable()
export class ReactivarCargo {
  constructor(@inject(DI_TYPES.CargoRepository) private readonly cargoRepository: CargoRepository) {}

  async execute(input: ReactivarCargoInput): Promise<Cargo> {
    return this.cargoRepository.reactivar(input.id, input.empresaId);
  }
}
