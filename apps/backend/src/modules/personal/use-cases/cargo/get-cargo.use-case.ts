import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { Cargo } from "@/modules/personal/domain/cargo";
import { CargoRepository } from "@/modules/personal/domain/cargo.repository";

export interface GetCargoInput {
  id: string;
  empresaId: string;
}

@injectable()
export class GetCargo {
  constructor(@inject(DI_TYPES.CargoRepository) private readonly cargoRepository: CargoRepository) {}

  async execute(input: GetCargoInput): Promise<Cargo> {
    const cargo = await this.cargoRepository.getById(input.id, input.empresaId);
    if (!cargo) throw new ApiError("Cargo no encontrado", Code.NOT_FOUND);
    return cargo;
  }
}
