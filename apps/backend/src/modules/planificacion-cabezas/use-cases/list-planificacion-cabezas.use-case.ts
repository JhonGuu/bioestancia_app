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

/**
 * Fila del reporte: o bien un plan real (`id` != null, viene de
 * `planificacion_cabezas`), o bien una fila "virtual" (`id` == null) para un
 * cliente+día que tuvo ventas pero NUNCA se planificó. Esto último es
 * necesario para que una entrega real nunca quede invisible en el reporte
 * solo porque nadie cargó un plan ese día — ver el comentario de `execute()`.
 *
 * `id: null` no es un problema para editar: `POST /planificacion-cabezas`
 * hace upsert por `(clienteId, fecha)`, no necesita el id existente.
 */
export interface PlanificacionCabezasConVentas
  extends Omit<PlanificacionCabezas, "id" | "createdAt" | "updatedAt"> {
  id: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
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
 * El cruce parte de TODA la empresa (no solo de los clientes que ya tienen
 * un día planificado en el rango): si un cliente tuvo una entrega real sin
 * plan cargado, igual aparece acá con `cabezasPlanificadas: 0` e `id: null`.
 * Antes esto no pasaba — la lista solo mostraba clientes con al menos un día
 * planificado, así que una entrega sin plan quedaba invisible.
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

    // Ventas de TODA la empresa en el rango (no solo de los clientes con
    // plan) — así ninguna entrega real queda afuera del cruce.
    const todasLasVentas = await this.ventaRepository.listByEmpresaYRango(input.empresaId, desde, hasta);
    const ventasEnRango = input.clienteId
      ? todasLasVentas.filter((v) => v.clienteId === input.clienteId)
      : todasLasVentas;

    const garronesPorClienteYDia = new Map<string, Set<number>>();
    for (const venta of ventasEnRango) {
      if (venta.formaVenta === FormaVenta.COMPENSACION_KG || venta.garron === null) {
        continue;
      }
      const clave = `${venta.clienteId}|${this.aClaveDeDia(venta.fecha)}`;
      if (!garronesPorClienteYDia.has(clave)) {
        garronesPorClienteYDia.set(clave, new Set());
      }
      garronesPorClienteYDia.get(clave)?.add(venta.garron);
    }
    const cabezasVendidasPorClienteYDia = new Map<string, number>();
    for (const [clave, garrones] of garronesPorClienteYDia) {
      cabezasVendidasPorClienteYDia.set(clave, garrones.size);
    }

    const filas = new Map<string, PlanificacionCabezasConVentas>();

    // 1. Todos los planes reales del rango.
    for (const plan of planes) {
      const clave = `${plan.clienteId}|${this.aClaveDeDia(plan.fecha)}`;
      filas.set(clave, {
        ...plan,
        cabezasVendidas: cabezasVendidasPorClienteYDia.get(clave) ?? 0,
      });
    }

    // 2. Cliente+día con ventas pero SIN plan → fila virtual (id null).
    for (const [clave, garrones] of garronesPorClienteYDia) {
      if (filas.has(clave)) continue;
      const [clienteId, diaIso] = clave.split("|");
      filas.set(clave, {
        id: null,
        empresaId: input.empresaId,
        clienteId,
        fecha: new Date(`${diaIso}T00:00:00.000Z`),
        cabezasPlanificadas: 0,
        cabezasVendidas: garrones.size,
        comentarios: null,
        activo: true,
        createdAt: null,
        updatedAt: null,
      });
    }

    return [...filas.values()].sort(
      (a, b) => a.fecha.getTime() - b.fecha.getTime() || a.clienteId.localeCompare(b.clienteId),
    );
  }

  /**
   * `setUTCHours`, no `setHours`: `desde`/`hasta` llegan de "YYYY-MM-DD"
   * parseado por `z.coerce.date()` (siempre medianoche UTC), y `aClaveDeDia`
   * también arma la clave en UTC. Si acá se normalizara en horario local del
   * server (ej. Argentina, UTC-3), el rango de la consulta quedaría corrido
   * ~3hs respecto de esas otras dos piezas — quedan bien mientras las tres
   * usen el mismo criterio (UTC).
   */
  private inicioDeDia(fecha: Date): Date {
    const normalizada = new Date(fecha);
    normalizada.setUTCHours(0, 0, 0, 0);
    return normalizada;
  }

  private finDeDia(fecha: Date): Date {
    const normalizada = new Date(fecha);
    normalizada.setUTCHours(23, 59, 59, 999);
    return normalizada;
  }

  private aClaveDeDia(fecha: Date): string {
    return fecha.toISOString().slice(0, 10);
  }
}
