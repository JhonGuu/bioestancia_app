import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { CargoRepository } from "@/modules/personal/domain/cargo.repository";

export interface DeleteCargoInput {
  id: string;
  empresaId: string;
}

@injectable()
export class DeleteCargo {
  constructor(@inject(DI_TYPES.CargoRepository) private readonly cargoRepository: CargoRepository) {}

  async execute(input: DeleteCargoInput): Promise<void> {
    await this.cargoRepository.delete(input.id, input.empresaId);
  }
}
