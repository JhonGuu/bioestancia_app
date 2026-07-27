import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { Venta } from "@/modules/ventas/domain/venta";
import { VentaRepository } from "@/modules/ventas/domain/venta.repository";

export interface GetVentaInput {
  id: string;
  empresaId: string;
}

@injectable()
export class GetVenta {
  constructor(@inject(DI_TYPES.VentaRepository) private readonly ventaRepository: VentaRepository) {}

  async execute(input: GetVentaInput): Promise<Venta> {
    const venta = await this.ventaRepository.getById(input.id, input.empresaId);
    if (!venta) {
      throw new ApiError("Venta no encontrada", Code.NOT_FOUND);
    }
    return venta;
  }
}
