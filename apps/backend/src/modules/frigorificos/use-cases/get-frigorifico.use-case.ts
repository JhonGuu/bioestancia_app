import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { Frigorifico } from "@/modules/frigorificos/domain/frigorifico";
import { FrigorificoRepository } from "@/modules/frigorificos/domain/frigorifico.repository";

export interface GetFrigorificoInput {
  id: string;
  empresaId: string;
}

@injectable()
export class GetFrigorifico {
  constructor(
    @inject(DI_TYPES.FrigorificoRepository) private readonly frigorificoRepository: FrigorificoRepository,
  ) {}

  async execute(input: GetFrigorificoInput): Promise<Frigorifico> {
    const frigorifico = await this.frigorificoRepository.getById(input.id, input.empresaId);
    if (!frigorifico) {
      throw new ApiError("Frigorífico no encontrado", Code.NOT_FOUND);
    }
    return frigorifico;
  }
}
