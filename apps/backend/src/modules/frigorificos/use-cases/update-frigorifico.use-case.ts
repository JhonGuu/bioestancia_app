import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { Frigorifico } from "@/modules/frigorificos/domain/frigorifico";
import {
  FrigorificoRepository,
  UpdateFrigorificoInput,
} from "@/modules/frigorificos/domain/frigorifico.repository";

export type UpdateFrigorificoUseCaseInput = UpdateFrigorificoInput & {
  id: string;
  empresaId: string;
};

/** El 404 (si no existe o no es de esta empresa) lo tira el repositorio, ver `update()`. */
@injectable()
export class UpdateFrigorifico {
  constructor(
    @inject(DI_TYPES.FrigorificoRepository) private readonly frigorificoRepository: FrigorificoRepository,
  ) {}

  async execute(input: UpdateFrigorificoUseCaseInput): Promise<Frigorifico> {
    const { id, empresaId, ...rest } = input;
    return this.frigorificoRepository.update(id, empresaId, rest);
  }
}
