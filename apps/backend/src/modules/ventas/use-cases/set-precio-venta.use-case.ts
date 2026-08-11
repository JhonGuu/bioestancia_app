import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { Venta } from "@/modules/ventas/domain/venta";
import { VentaRepository } from "@/modules/ventas/domain/venta.repository";

export interface SetPrecioVentaInput {
  id: string;
  empresaId: string;
  precioKg: number;
}

/**
 * Completa el precio de una venta que se cargó sin precio (flujo del
 * operario, ver `modules/boletas/use-cases/cargar-boleta-con-items.use-case.ts`).
 * Tarea de administración/contable — el operario no ve precios.
 *
 * Se puede llamar más de una vez (ej. para corregir un precio mal cargado):
 * no valida que `precioKg` sea null todavía. Si el día de mañana hace falta
 * bloquear la edición una vez facturada la liquidación/boleta, va acá.
 */
@injectable()
export class SetPrecioVenta {
  constructor(@inject(DI_TYPES.VentaRepository) private readonly ventaRepository: VentaRepository) {}

  async execute(input: SetPrecioVentaInput): Promise<Venta> {
    const venta = await this.ventaRepository.getById(input.id, input.empresaId);
    if (!venta) {
      throw new ApiError("Venta no encontrada", Code.NOT_FOUND);
    }

    const total = Math.round(venta.kg * input.precioKg * 100) / 100;
    return this.ventaRepository.setPrecio(input.id, input.empresaId, {
      precioKg: input.precioKg,
      total,
    });
  }
}
