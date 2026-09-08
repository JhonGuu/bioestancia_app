import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { Logger } from "@/shared/infra/logger/logger";
import { Venta } from "@/modules/ventas/domain/venta";
import { VentaRepository } from "@/modules/ventas/domain/venta.repository";
import { CobroRepository } from "@/modules/cobros/domain/cobro.repository";
import { calcularMontoBoleta } from "@/modules/boletas/domain/calcular-monto-boleta";
import { ajustarAplicacionesBoleta } from "@/modules/cobros/use-cases/ajustar-aplicaciones-boleta";
import { GenerarAsientosAutomaticos } from "@/modules/contabilidad/use-cases/generar-asientos-automaticos.use-case";
import { regenerarAsientoBoletaFacturada } from "@/modules/boletas/use-cases/regenerar-asiento-boleta-facturada";

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
 * Se puede llamar más de una vez (ej. para corregir un precio mal cargado,
 * o porque el jefe pidió bajarlo en una boleta puntual): no valida que
 * `precioKg` sea null todavía. Si la venta pertenece a una boleta que ya
 * tenía cobros aplicados (FIFO) y el nuevo precio hace que el total baje por
 * debajo de lo aplicado, revierte el exceso — queda como saldo a favor del
 * cliente (ver `modules/cobros/use-cases/ajustar-aplicaciones-boleta.ts`).
 */
@injectable()
export class SetPrecioVenta {
  constructor(
    @inject(DI_TYPES.VentaRepository) private readonly ventaRepository: VentaRepository,
    @inject(DI_TYPES.CobroRepository) private readonly cobroRepository: CobroRepository,
    @inject(DI_TYPES.GenerarAsientosAutomaticos) private readonly generarAsientosAutomaticos: GenerarAsientosAutomaticos,
    @inject(DI_TYPES.Logger) private readonly logger: Logger,
  ) {}

  async execute(input: SetPrecioVentaInput): Promise<Venta> {
    const venta = await this.ventaRepository.getById(input.id, input.empresaId);
    if (!venta) {
      throw new ApiError("Venta no encontrada", Code.NOT_FOUND);
    }

    const total = Math.round(venta.kg * input.precioKg * 100) / 100;
    const actualizada = await this.ventaRepository.setPrecio(input.id, input.empresaId, {
      precioKg: input.precioKg,
      total,
    });

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
        { boletaId: venta.boletaId, empresaId: input.empresaId, clienteId: venta.clienteId, fecha: venta.fecha, numero: null },
        ventasBoleta,
      );
      if (advertencia) this.logger.warn(advertencia);
    }

    return actualizada;
  }
}
