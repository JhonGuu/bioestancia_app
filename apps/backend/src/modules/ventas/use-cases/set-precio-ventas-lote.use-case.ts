import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { Venta } from "@/modules/ventas/domain/venta";
import { SetPrecioVenta } from "@/modules/ventas/use-cases/set-precio-venta.use-case";

export interface SetPrecioVentasLoteInput {
  empresaId: string;
  ventaIds: string[];
  precioKg: number;
}

/**
 * Completa el mismo precio por kg a varias ventas de un saque — pensado
 * para el flujo real: el precio se pacta por cliente+categoría (a veces
 * +presentación), no venta por venta, así que el frontend agrupa las
 * ventas pendientes de precio de una boleta por categoría/presentación y
 * llama acá una vez por grupo, no una vez por garrón.
 *
 * Reusa `SetPrecioVenta` (misma validación/cálculo de total) en un loop —
 * si alguna `ventaId` no existe (o no es de esta empresa), tira ahí mismo y
 * las anteriores del lote quedan igual guardadas (no es una transacción).
 */
@injectable()
export class SetPrecioVentasLote {
  constructor(@inject(DI_TYPES.SetPrecioVenta) private readonly setPrecioVenta: SetPrecioVenta) {}

  async execute(input: SetPrecioVentasLoteInput): Promise<Venta[]> {
    const resultados: Venta[] = [];
    for (const ventaId of input.ventaIds) {
      const venta = await this.setPrecioVenta.execute({
        id: ventaId,
        empresaId: input.empresaId,
        precioKg: input.precioKg,
      });
      resultados.push(venta);
    }
    return resultados;
  }
}
