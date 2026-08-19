import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { Cargo } from "@/modules/personal/domain/cargo";
import { CargoRepository, UpdateCargoInput } from "@/modules/personal/domain/cargo.repository";

export type UpdateCargoUseCaseInput = UpdateCargoInput & { id: string; empresaId: string };

@injectable()
export class UpdateCargo {
  constructor(@inject(DI_TYPES.CargoRepository) private readonly cargoRepository: CargoRepository) {}

  async execute(input: UpdateCargoUseCaseInput): Promise<Cargo> {
    const { id, empresaId, ...rest } = input;
    return this.cargoRepository.update(id, empresaId, rest);
  }
}
