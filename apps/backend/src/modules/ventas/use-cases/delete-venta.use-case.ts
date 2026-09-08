import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { Logger } from "@/shared/infra/logger/logger";
import { VentaRepository } from "@/modules/ventas/domain/venta.repository";
import { CobroRepository } from "@/modules/cobros/domain/cobro.repository";
import { calcularMontoBoleta } from "@/modules/boletas/domain/calcular-monto-boleta";
import { ajustarAplicacionesBoleta } from "@/modules/cobros/use-cases/ajustar-aplicaciones-boleta";
import { GenerarAsientosAutomaticos } from "@/modules/contabilidad/use-cases/generar-asientos-automaticos.use-case";
import { regenerarAsientoBoletaFacturada } from "@/modules/boletas/use-cases/regenerar-asiento-boleta-facturada";

export interface DeleteVentaInput {
  id: string;
  empresaId: string;
}

/**
 * Borra (soft-delete) UNA línea de venta — para sacar un ítem cargado por
 * error, sin tocar el resto de la boleta. Si la venta pertenece a una
 * boleta, re-ajusta lo que ya se hubiera aplicado (FIFO) contra esa boleta
 * puntual, con el monto que le queda SIN esta línea.
 */
@injectable()
export class DeleteVenta {
  constructor(
    @inject(DI_TYPES.VentaRepository) private readonly ventaRepository: VentaRepository,
    @inject(DI_TYPES.CobroRepository) private readonly cobroRepository: CobroRepository,
    @inject(DI_TYPES.GenerarAsientosAutomaticos) private readonly generarAsientosAutomaticos: GenerarAsientosAutomaticos,
    @inject(DI_TYPES.Logger) private readonly logger: Logger,
  ) {}

  async execute(input: DeleteVentaInput): Promise<void> {
    const venta = await this.ventaRepository.getById(input.id, input.empresaId);
    if (!venta) {
      throw new ApiError("Venta no encontrada", Code.NOT_FOUND);
    }

    await this.ventaRepository.delete(input.id, input.empresaId);

    if (venta.boletaId) {
      const ventasBoleta = await this.ventaRepository.listByBoleta(venta.boletaId, input.empresaId);
      const { monto } = calcularMontoBoleta(ventasBoleta);
      await ajustarAplicacionesBoleta(this.cobroRepository, {
        boletaId: venta.boletaId,
        clienteId: venta.clienteId,
        empresaId: input.empresaId,
        nuevoMontoMax: monto,
      });

      const advertencia = await regenerarAsientoBoletaFacturada(
        this.generarAsientosAutomaticos,
        {
          boletaId: venta.boletaId,
          empresaId: input.empresaId,
          clienteId: venta.clienteId,
          fecha: ventasBoleta[0]?.fecha ?? venta.fecha,
          numero: null,
        },
        ventasBoleta,
      );
      if (advertencia) this.logger.warn(advertencia);
    }
  }
}
