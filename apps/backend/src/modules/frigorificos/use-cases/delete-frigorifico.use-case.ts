import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { FrigorificoRepository } from "@/modules/frigorificos/domain/frigorifico.repository";

export interface DeleteFrigorificoInput {
  id: string;
  empresaId: string;
}

/** Soft-delete — ver comentario en `FrigorificoRepository.delete()`. El 404 lo tira el repositorio. */
@injectable()
export class DeleteFrigorifico {
  constructor(
    @inject(DI_TYPES.FrigorificoRepository) private readonly frigorificoRepository: FrigorificoRepository,
  ) {}

  async execute(input: DeleteFrigorificoInput): Promise<void> {
    await this.frigorificoRepository.delete(input.id, input.empresaId);
  }
}
