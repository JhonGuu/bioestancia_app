import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ListaDePrecios } from "@/modules/listas-precios/domain/lista-de-precios";
import { ListaDePreciosRepository } from "@/modules/listas-precios/domain/lista-de-precios.repository";

export interface ListListasDePreciosInput {
  empresaId: string;
}

@injectable()
export class ListListasDePrecios {
  constructor(
    @inject(DI_TYPES.ListaDePreciosRepository)
    private readonly listaDePreciosRepository: ListaDePreciosRepository,
  ) {}

  async execute(input: ListListasDePreciosInput): Promise<ListaDePrecios[]> {
    return this.listaDePreciosRepository.list(input.empresaId);
  }
}
