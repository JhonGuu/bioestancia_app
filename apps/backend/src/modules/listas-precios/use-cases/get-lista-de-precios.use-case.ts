import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { ListaDePrecios } from "@/modules/listas-precios/domain/lista-de-precios";
import { ListaDePreciosRepository } from "@/modules/listas-precios/domain/lista-de-precios.repository";

export interface GetListaDePreciosInput {
  id: string;
  empresaId: string;
}

@injectable()
export class GetListaDePrecios {
  constructor(
    @inject(DI_TYPES.ListaDePreciosRepository)
    private readonly listaDePreciosRepository: ListaDePreciosRepository,
  ) {}

  async execute(input: GetListaDePreciosInput): Promise<ListaDePrecios> {
    const lista = await this.listaDePreciosRepository.getById(input.id, input.empresaId);
    if (!lista) {
      throw new ApiError("Lista de precios no encontrada", Code.NOT_FOUND);
    }
    return lista;
  }
}
