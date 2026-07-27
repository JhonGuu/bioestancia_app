import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { PlanificacionCabezasRepository } from "@/modules/planificacion-cabezas/domain/planificacion-cabezas.repository";
import { PlanificacionCabezas } from "@/modules/planificacion-cabezas/domain/planificacion-cabezas";
import { VentaRepository } from "@/modules/ventas/domain/venta.repository";
import { FormaVenta } from "@/modules/ventas/domain/forma-venta";

export interface ListPlanificacionCabezasInput {
  empresaId: string;
  desde: Date;
  hasta: Date;
  clienteId?: string;
}

export interface PlanificacionCabezasConVentas extends PlanificacionCabezas {
  /**
   * Garrones distintos vendidos a este cliente en este día (no filas — mismo
   * criterio que la reconciliación de `cerrar-compra`: no cuenta filas de
   * `compensacion_kg`). Si el mismo garrón se vendió como 2 medias reses a
   * ESTE MISMO cliente, cuenta una sola vez; si se vendió a 2 clientes
   * distintos, cada uno se lleva el crédito de esa cabeza.
   */
  cabezasVendidas: number;
}

/**
 * Lista el plan de cabezas en un rango de fechas (un cliente puntual, o
 * todos si no se pasa `clienteId`) cruzado contra lo efectivamente vendido.
 *
 * El cruce se hace solo para los clientes que tienen al menos un día
 * planificado en el rango — esto es una lista de planificación, no un
 * reporte general de ventas por cliente.
 */
@injectable()
export class ListPlanificacionCabezas {
  constructor(
    @inject(DI_TYPES.PlanificacionCabezasRepository)
    private readonly planificacionCabezasRepository: PlanificacionCabezasRepository,
    @inject(DI_TYPES.VentaRepository) private readonly ventaRepository: VentaRepository,
  ) {}

  async execute(input: ListPlanificacionCabezasInput): Promise<PlanificacionCabezasConVentas[]> {
    const desde = this.inicioDeDia(input.desde);
    const hasta = this.finDeDia(input.hasta);

    const planes = await this.planificacionCabezasRepository.listByRango({
      empresaId: input.empresaId,
      desde,
      hasta,
      clienteId: input.clienteId,
    });

    const clienteIds = [...new Set(planes.map((p) => p.clienteId))];
    const cabezasVendidasPorClienteYDia = new Map<string, number>();

    for (const clienteId of clienteIds) {
      const ventasDelCliente = await this.ventaRepository.listByClienteYRango(
        clienteId,
        input.empresaId,
        desde,
        hasta,
      );
      const garronesPorDia = new Map<string, Set<number>>();
      for (const venta of ventasDelCliente) {
        if (venta.formaVenta === FormaVenta.COMPENSACION_KG || venta.garron === null) {
          continue;
        }
        const clave = `${clienteId}|${this.aClaveDeDia(venta.fecha)}`;
        if (!garronesPorDia.has(clave)) {
          garronesPorDia.set(clave, new Set());
        }
        garronesPorDia.get(clave)?.add(venta.garron);
      }
      for (const [clave, garrones] of garronesPorDia) {
        cabezasVendidasPorClienteYDia.set(clave, garrones.size);
      }
    }

    return planes.map((plan) => ({
      ...plan,
      cabezasVendidas:
        cabezasVendidasPorClienteYDia.get(`${plan.clienteId}|${this.aClaveDeDia(plan.fecha)}`) ?? 0,
    }));
  }

  private inicioDeDia(fecha: Date): Date {
    const normalizada = new Date(fecha);
    normalizada.setHours(0, 0, 0, 0);
    return normalizada;
  }

  private finDeDia(fecha: Date): Date {
    const normalizada = new Date(fecha);
    normalizada.setHours(23, 59, 59, 999);
    return normalizada;
  }

  private aClaveDeDia(fecha: Date): string {
    return fecha.toISOString().slice(0, 10);
  }
}
