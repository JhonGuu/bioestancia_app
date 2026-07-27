import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { Venta } from "@/modules/ventas/domain/venta";
import { VentaRepository } from "@/modules/ventas/domain/venta.repository";

export interface ListVentasInput {
  empresaId: string;
}

@injectable()
export class ListVentas {
  constructor(@inject(DI_TYPES.VentaRepository) private readonly ventaRepository: VentaRepository) {}

  async execute(input: ListVentasInput): Promise<Venta[]> {
    return this.ventaRepository.list(input.empresaId);
  }
}
