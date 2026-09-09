import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { GrupoTropas } from "@/modules/grupos-tropas/domain/grupo-tropas";
import { GrupoTropasRepository } from "@/modules/grupos-tropas/domain/grupo-tropas.repository";

export interface ListGruposTropasInput {
  empresaId: string;
}

@injectable()
export class ListGruposTropas {
  constructor(
    @inject(DI_TYPES.GrupoTropasRepository) private readonly grupoTropasRepository: GrupoTropasRepository,
  ) {}

  async execute(input: ListGruposTropasInput): Promise<GrupoTropas[]> {
    return this.grupoTropasRepository.list(input.empresaId);
  }
}
