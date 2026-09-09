import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { Compra } from "@/modules/compras/domain/compra";
import { CompraRepository } from "@/modules/compras/domain/compra.repository";
import { GrupoTropas } from "@/modules/grupos-tropas/domain/grupo-tropas";
import { GrupoTropasRepository } from "@/modules/grupos-tropas/domain/grupo-tropas.repository";

export interface GetGrupoTropasInput {
  id: string;
  empresaId: string;
}

export interface GrupoTropasConMiembros extends GrupoTropas {
  compras: Compra[];
}

@injectable()
export class GetGrupoTropas {
  constructor(
    @inject(DI_TYPES.GrupoTropasRepository) private readonly grupoTropasRepository: GrupoTropasRepository,
    @inject(DI_TYPES.CompraRepository) private readonly compraRepository: CompraRepository,
  ) {}

  async execute(input: GetGrupoTropasInput): Promise<GrupoTropasConMiembros> {
    const grupo = await this.grupoTropasRepository.getById(input.id, input.empresaId);
    if (!grupo) {
      throw new ApiError("Grupo de tropas no encontrado", Code.NOT_FOUND);
    }
    const compras = await this.compraRepository.listByGrupo(grupo.id, input.empresaId);
    return { ...grupo, compras };
  }
}
