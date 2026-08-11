import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { Boleta } from "@/modules/boletas/domain/boleta";
import { BoletaRepository } from "@/modules/boletas/domain/boleta.repository";
import { Venta } from "@/modules/ventas/domain/venta";
import { VentaRepository } from "@/modules/ventas/domain/venta.repository";

export interface GetBoletaInput {
  id: string;
  empresaId: string;
}

export interface BoletaConVentas extends Boleta {
  ventas: Venta[];
}

/**
 * Trae la boleta con sus ítems (`ventas`) — el operario la usa para revisar
 * lo que ya cargó, y administración/contable para ver qué falta de precio
 * (`Venta.precioKg === null`).
 */
@injectable()
export class GetBoleta {
  constructor(
    @inject(DI_TYPES.BoletaRepository) private readonly boletaRepository: BoletaRepository,
    @inject(DI_TYPES.VentaRepository) private readonly ventaRepository: VentaRepository,
  ) {}

  async execute(input: GetBoletaInput): Promise<BoletaConVentas> {
    const boleta = await this.boletaRepository.getById(input.id, input.empresaId);
    if (!boleta) {
      throw new ApiError("Boleta no encontrada", Code.NOT_FOUND);
    }
    const ventas = await this.ventaRepository.listByBoleta(boleta.id, input.empresaId);
    return { ...boleta, ventas };
  }
}
