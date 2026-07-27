import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { Compra } from "@/modules/compras/domain/compra";
import { CompraRepository } from "@/modules/compras/domain/compra.repository";

export interface ListComprasInput {
  empresaId: string;
}

@injectable()
export class ListCompras {
  constructor(@inject(DI_TYPES.CompraRepository) private readonly compraRepository: CompraRepository) {}

  async execute(input: ListComprasInput): Promise<Compra[]> {
    return this.compraRepository.list(input.empresaId);
  }
}
