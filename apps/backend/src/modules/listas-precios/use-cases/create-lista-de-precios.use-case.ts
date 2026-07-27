import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ListaDePrecios } from "@/modules/listas-precios/domain/lista-de-precios";
import { ListaDePreciosRepository } from "@/modules/listas-precios/domain/lista-de-precios.repository";

export interface CreateListaDePreciosInput {
  empresaId: string;
  nombre: string;
  descripcion?: string;
}

@injectable()
export class CreateListaDePrecios {
  constructor(
    @inject(DI_TYPES.ListaDePreciosRepository)
    private readonly listaDePreciosRepository: ListaDePreciosRepository,
  ) {}

  async execute(input: CreateListaDePreciosInput): Promise<ListaDePrecios> {
    return this.listaDePreciosRepository.create(input);
  }
}
