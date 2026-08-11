import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { Venta } from "@/modules/ventas/domain/venta";
import { VentaRepository, CreateVentaInput } from "@/modules/ventas/domain/venta.repository";

export type CreateVentaUseCaseInput = Omit<CreateVentaInput, "total">;

@injectable()
export class CreateVenta {
  constructor(@inject(DI_TYPES.VentaRepository) private readonly ventaRepository: VentaRepository) {}

  /**
   * `total` no se recibe del caller: se calcula acá (`kg * precioKg`) para no
   * confiar en un total que mande el cliente HTTP — la única fuente de verdad
   * son los kg y el precio.
   *
   * `precioKg` es opcional (ver `Venta.precioKg`): si no viene, la venta
   * queda cargada sin precio ni total — pendiente de que alguien de
   * administración/contable la complete con `SetPrecioVenta`.
   */
  async execute(input: CreateVentaUseCaseInput): Promise<Venta> {
    const total =
      input.precioKg !== undefined ? Math.round(input.kg * input.precioKg * 100) / 100 : undefined;
    return this.ventaRepository.create({ ...input, total });
  }
}
