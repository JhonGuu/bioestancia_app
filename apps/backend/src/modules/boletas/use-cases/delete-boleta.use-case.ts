import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { BoletaRepository } from "@/modules/boletas/domain/boleta.repository";
import { VentaRepository } from "@/modules/ventas/domain/venta.repository";
import { CobroRepository } from "@/modules/cobros/domain/cobro.repository";
import { ajustarAplicacionesBoleta } from "@/modules/cobros/use-cases/ajustar-aplicaciones-boleta";

export interface DeleteBoletaInput {
  id: string;
  empresaId: string;
}

/**
 * Borra (soft-delete) una boleta completa — para arreglar una carga mal
 * hecha desde cero. Cascadea el soft-delete a todas las `ventas` de la
 * boleta y libera cualquier cobro que se le hubiera aplicado (FIFO) contra
 * ella (`nuevoMontoMax: 0` — queda todo como saldo a favor del cliente, ver
 * `modules/cobros/use-cases/ajustar-aplicaciones-boleta.ts`).
 */
@injectable()
export class DeleteBoleta {
  constructor(
    @inject(DI_TYPES.BoletaRepository) private readonly boletaRepository: BoletaRepository,
    @inject(DI_TYPES.VentaRepository) private readonly ventaRepository: VentaRepository,
    @inject(DI_TYPES.CobroRepository) private readonly cobroRepository: CobroRepository,
  ) {}

  async execute(input: DeleteBoletaInput): Promise<void> {
    const boleta = await this.boletaRepository.getById(input.id, input.empresaId);
    if (!boleta) {
      throw new ApiError("Boleta no encontrada", Code.NOT_FOUND);
    }

    const ventas = await this.ventaRepository.listByBoleta(input.id, input.empresaId);
    for (const venta of ventas) {
      await this.ventaRepository.delete(venta.id, input.empresaId);
    }

    await this.boletaRepository.delete(input.id, input.empresaId);

    await ajustarAplicacionesBoleta(this.cobroRepository, {
      boletaId: input.id,
      clienteId: boleta.clienteId,
      empresaId: input.empresaId,
      nuevoMontoMax: 0,
    });
  }
}
