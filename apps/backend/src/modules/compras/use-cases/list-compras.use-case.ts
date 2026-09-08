import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { PaginatedResult, PaginationQuery } from "@/shared/infra/http/pagination";
import { Compra } from "@/modules/compras/domain/compra";
import { CompraRepository } from "@/modules/compras/domain/compra.repository";

export interface ListComprasInput {
  empresaId: string;
  /** Si no viene, devuelve TODO (ver nota en `CompraRepository.list`) — hoy lo usan informes-compras, el reporte diario de boletas y el stock de tropas; no pasarlo desde una pantalla nueva. */
  pagination?: PaginationQuery;
}

@injectable()
export class ListCompras {
  constructor(@inject(DI_TYPES.CompraRepository) private readonly compraRepository: CompraRepository) {}

  execute(input: ListComprasInput & { pagination: PaginationQuery }): Promise<PaginatedResult<Compra>>;
  execute(input: ListComprasInput): Promise<Compra[] | PaginatedResult<Compra>>;
  async execute(input: ListComprasInput): Promise<Compra[] | PaginatedResult<Compra>> {
    if (input.pagination) {
      return this.compraRepository.list(input.empresaId, input.pagination);
    }
    return this.compraRepository.list(input.empresaId);
  }
}
