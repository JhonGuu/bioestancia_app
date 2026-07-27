import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { CompraRepository } from "@/modules/compras/domain/compra.repository";
import { CompraCategoriaRepository } from "@/modules/compras/domain/compra-categoria.repository";
import { CompraConCategorias } from "@/modules/compras/use-cases/create-compra.use-case";

export interface GetCompraInput {
  id: string;
  empresaId: string;
}

@injectable()
export class GetCompra {
  constructor(
    @inject(DI_TYPES.CompraRepository) private readonly compraRepository: CompraRepository,
    @inject(DI_TYPES.CompraCategoriaRepository)
    private readonly compraCategoriaRepository: CompraCategoriaRepository,
  ) {}

  async execute(input: GetCompraInput): Promise<CompraConCategorias> {
    const compra = await this.compraRepository.getById(input.id, input.empresaId);
    if (!compra) {
      throw new ApiError("Compra no encontrada", Code.NOT_FOUND);
    }
    const categorias = await this.compraCategoriaRepository.listByCompra(compra.id);
    return { ...compra, categorias };
  }
}
