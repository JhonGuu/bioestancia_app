import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { PaginatedResult, PaginationQuery } from "@/shared/infra/http/pagination";
import { Venta } from "@/modules/ventas/domain/venta";
import { VentaRepository } from "@/modules/ventas/domain/venta.repository";

export interface ListVentasInput {
  empresaId: string;
  /** Si no viene, devuelve TODO (ver nota en `VentaRepository.list`) — hoy lo usan pantallas viejas (dashboard, precios pendientes) que agregan sobre el total; no pasarlo desde una pantalla nueva. */
  pagination?: PaginationQuery;
}

@injectable()
export class ListVentas {
  constructor(@inject(DI_TYPES.VentaRepository) private readonly ventaRepository: VentaRepository) {}

  execute(input: ListVentasInput & { pagination: PaginationQuery }): Promise<PaginatedResult<Venta>>;
  execute(input: ListVentasInput): Promise<Venta[] | PaginatedResult<Venta>>;
  async execute(input: ListVentasInput): Promise<Venta[] | PaginatedResult<Venta>> {
    if (input.pagination) {
      return this.ventaRepository.list(input.empresaId, input.pagination);
    }
    return this.ventaRepository.list(input.empresaId);
  }
}
