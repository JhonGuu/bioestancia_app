import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { ResultadoFaenaRepository } from "@/modules/resultado-faena/domain/resultado-faena.repository";
import { CompraCategoriaRepository } from "@/modules/compras/domain/compra-categoria.repository";
import { ResultadoFaenaConCategorias } from "@/modules/resultado-faena/use-cases/create-resultado-faena.use-case";

export interface GetResultadoFaenaInput {
  compraId: string;
  empresaId: string;
}

@injectable()
export class GetResultadoFaena {
  constructor(
    @inject(DI_TYPES.ResultadoFaenaRepository)
    private readonly resultadoFaenaRepository: ResultadoFaenaRepository,
    @inject(DI_TYPES.CompraCategoriaRepository)
    private readonly compraCategoriaRepository: CompraCategoriaRepository,
  ) {}

  async execute(input: GetResultadoFaenaInput): Promise<ResultadoFaenaConCategorias> {
    const resultado = await this.resultadoFaenaRepository.getByCompraId(input.compraId, input.empresaId);
    if (!resultado) {
      throw new ApiError("Esta compra todavía no tiene un resultado de faena cargado", Code.NOT_FOUND);
    }
    const categorias = await this.compraCategoriaRepository.listByCompra(input.compraId);
    return { ...resultado, categorias };
  }
}
