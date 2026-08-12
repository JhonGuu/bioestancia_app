import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { BoletaRepository } from "@/modules/boletas/domain/boleta.repository";
import { calcularMontoBoleta } from "@/modules/boletas/domain/calcular-monto-boleta";
import { VentaRepository } from "@/modules/ventas/domain/venta.repository";
import { CobroRepository } from "@/modules/cobros/domain/cobro.repository";

export interface AplicarCobroFifoInput {
  clienteId: string;
  empresaId: string;
  /** Monto total del cobro a distribuir (suma de sus líneas). */
  montoDisponible: number;
}

export interface AplicacionCalculada {
  boletaId: string;
  monto: number;
}

/** Redondeo a centavos — evita arrastrar errores de punto flotante entre boletas. */
function redondear(valor: number): number {
  return Math.round(valor * 100) / 100;
}

/**
 * Calcula cómo distribuir un cobro entre las boletas pendientes de un
 * cliente, más antigua primero (FIFO por `Boleta.fecha`) — decisión tomada
 * en la planificación de Ventas (`docs/plan-ventas-cuenta-corriente.md`).
 *
 * Reglas:
 * - Una boleta "pendiente" es la que tiene saldo > 0 después de restar lo ya
 *   aplicado en `AplicacionCobro`s previas.
 * - El monto de una boleta es la suma de `total` de sus ventas — pero SOLO
 *   si TODAS sus ventas ya tienen precio cargado. Una boleta con alguna
 *   venta "pendiente de precio" no participa del FIFO todavía (su monto
 *   real todavía no se conoce) — queda afuera hasta que se complete.
 * - Si el cobro alcanza y sobra, el excedente no se aplica a nada — queda
 *   como "saldo a favor" (lo calcula `modules/cuenta-corriente`, no se
 *   escribe acá).
 *
 * Solo CALCULA — no persiste nada. El caller (`CreateCobro`) es quien
 * guarda el resultado con `CobroRepository.crearAplicaciones()`.
 */
@injectable()
export class AplicarCobroFifo {
  constructor(
    @inject(DI_TYPES.BoletaRepository) private readonly boletaRepository: BoletaRepository,
    @inject(DI_TYPES.VentaRepository) private readonly ventaRepository: VentaRepository,
    @inject(DI_TYPES.CobroRepository) private readonly cobroRepository: CobroRepository,
  ) {}

  async execute(input: AplicarCobroFifoInput): Promise<AplicacionCalculada[]> {
    if (input.montoDisponible <= 0) return [];

    const [boletas, ventas, aplicacionesPrevias] = await Promise.all([
      this.boletaRepository.listByCliente(input.clienteId, input.empresaId),
      this.ventaRepository.listByCliente(input.clienteId, input.empresaId),
      this.cobroRepository.listAplicacionesByCliente(input.clienteId, input.empresaId),
    ]);

    const ventasPorBoleta = new Map<string, typeof ventas>();
    for (const venta of ventas) {
      if (!venta.boletaId) continue;
      const arr = ventasPorBoleta.get(venta.boletaId) ?? [];
      arr.push(venta);
      ventasPorBoleta.set(venta.boletaId, arr);
    }

    const aplicadoPorBoleta = new Map<string, number>();
    for (const aplicacion of aplicacionesPrevias) {
      aplicadoPorBoleta.set(
        aplicacion.boletaId,
        (aplicadoPorBoleta.get(aplicacion.boletaId) ?? 0) + aplicacion.monto,
      );
    }

    const pendientes = boletas
      .map((boleta) => {
        const ventasBoleta = ventasPorBoleta.get(boleta.id) ?? [];
        const { monto: montoBoleta } = calcularMontoBoleta(ventasBoleta);
        const aplicado = aplicadoPorBoleta.get(boleta.id) ?? 0;
        const saldo = redondear(montoBoleta - aplicado);
        return { boleta, saldo };
      })
      .filter((x) => x.saldo > 0.01)
      .sort((a, b) => a.boleta.fecha.getTime() - b.boleta.fecha.getTime());

    let restante = input.montoDisponible;
    const aplicaciones: AplicacionCalculada[] = [];
    for (const { boleta, saldo } of pendientes) {
      if (restante <= 0.01) break;
      const monto = redondear(Math.min(restante, saldo));
      aplicaciones.push({ boletaId: boleta.id, monto });
      restante = redondear(restante - monto);
    }

    return aplicaciones;
  }
}
