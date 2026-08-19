import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { Cargo } from "@/modules/personal/domain/cargo";
import { CargoRepository, CreateCargoInput } from "@/modules/personal/domain/cargo.repository";

@injectable()
export class CreateCargo {
  constructor(@inject(DI_TYPES.CargoRepository) private readonly cargoRepository: CargoRepository) {}

  async execute(input: CreateCargoInput): Promise<Cargo> {
    return this.cargoRepository.create(input);
  }
}
