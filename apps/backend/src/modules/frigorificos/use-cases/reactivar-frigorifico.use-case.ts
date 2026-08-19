import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { Frigorifico } from "@/modules/frigorificos/domain/frigorifico";
import { FrigorificoRepository } from "@/modules/frigorificos/domain/frigorifico.repository";

export interface ReactivarFrigorificoInput {
  id: string;
  empresaId: string;
}

/** Deshace un soft-delete — ver comentario en `FrigorificoRepository.reactivar()`. El 404 lo tira el repositorio. */
@injectable()
export class ReactivarFrigorifico {
  constructor(
    @inject(DI_TYPES.FrigorificoRepository) private readonly frigorificoRepository: FrigorificoRepository,
  ) {}

  async execute(input: ReactivarFrigorificoInput): Promise<Frigorifico> {
    return this.frigorificoRepository.reactivar(input.id, input.empresaId);
  }
}
