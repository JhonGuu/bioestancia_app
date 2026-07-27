import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { LiquidacionCompraRepository } from "@/modules/liquidacion-compra/domain/liquidacion-compra.repository";
import { CompraCategoriaRepository } from "@/modules/compras/domain/compra-categoria.repository";
import { LiquidacionCompraConCategorias } from "@/modules/liquidacion-compra/use-cases/create-liquidacion-compra.use-case";

export interface GetLiquidacionCompraInput {
  compraId: string;
  empresaId: string;
}

@injectable()
export class GetLiquidacionCompra {
  constructor(
    @inject(DI_TYPES.LiquidacionCompraRepository)
    private readonly liquidacionCompraRepository: LiquidacionCompraRepository,
    @inject(DI_TYPES.CompraCategoriaRepository)
    private readonly compraCategoriaRepository: CompraCategoriaRepository,
  ) {}

  async execute(input: GetLiquidacionCompraInput): Promise<LiquidacionCompraConCategorias> {
    const liquidacion = await this.liquidacionCompraRepository.getByCompraId(
      input.compraId,
      input.empresaId,
    );
    if (!liquidacion) {
      throw new ApiError("Esta compra todavía no tiene una liquidación cargada", Code.NOT_FOUND);
    }
    const categorias = await this.compraCategoriaRepository.listByCompra(input.compraId);
    return { ...liquidacion, categorias };
  }
}
