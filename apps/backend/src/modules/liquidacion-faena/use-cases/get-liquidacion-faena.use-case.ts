import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { LiquidacionFaenaRepository } from "@/modules/liquidacion-faena/domain/liquidacion-faena.repository";
import { CompraCategoriaRepository } from "@/modules/compras/domain/compra-categoria.repository";
import { LiquidacionFaenaConCategorias } from "@/modules/liquidacion-faena/use-cases/create-liquidacion-faena.use-case";

export interface GetLiquidacionFaenaInput {
  compraId: string;
  empresaId: string;
}

@injectable()
export class GetLiquidacionFaena {
  constructor(
    @inject(DI_TYPES.LiquidacionFaenaRepository)
    private readonly liquidacionFaenaRepository: LiquidacionFaenaRepository,
    @inject(DI_TYPES.CompraCategoriaRepository)
    private readonly compraCategoriaRepository: CompraCategoriaRepository,
  ) {}

  async execute(input: GetLiquidacionFaenaInput): Promise<LiquidacionFaenaConCategorias> {
    const liquidacion = await this.liquidacionFaenaRepository.getByCompraId(input.compraId, input.empresaId);
    if (!liquidacion) {
      throw new ApiError("Esta compra todavía no tiene una liquidación de faena cargada", Code.NOT_FOUND);
    }
    const categorias = await this.compraCategoriaRepository.listByCompra(input.compraId);
    return { ...liquidacion, categorias };
  }
}
