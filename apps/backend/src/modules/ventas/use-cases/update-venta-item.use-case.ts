import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { Venta } from "@/modules/ventas/domain/venta";
import { VentaRepository } from "@/modules/ventas/domain/venta.repository";
import { FormaVenta } from "@/modules/ventas/domain/forma-venta";
import { CategoriaVenta } from "@/modules/ventas/domain/categoria-venta";
import { CobroRepository } from "@/modules/cobros/domain/cobro.repository";
import { calcularMontoBoleta } from "@/modules/boletas/domain/calcular-monto-boleta";
import { ajustarAplicacionesBoleta } from "@/modules/cobros/use-cases/ajustar-aplicaciones-boleta";

export interface UpdateVentaItemInput {
  id: string;
  empresaId: string;
  garron?: number | null;
  kg?: number;
  categoria?: CategoriaVenta | null;
  comentarios?: string | null;
}

/**
 * Corrige los datos de UNA línea de venta ya cargada (garrón/kg/categoría/
 * comentarios) — para arreglar una carga mal hecha, sin tocar `precioKg`
 * (eso es tarea de `SetPrecioVenta`, administración/contable). Pensado para
 * que el operario pueda usarlo también (`RoleGroups.BoletaLoaders`).
 *
 * Si la venta ya tenía `precioKg` cargado y cambia `kg`, recalcula `total` —
 * y si la venta pertenece a una boleta, re-ajusta lo que ya se hubiera
 * aplicado (FIFO) contra esa boleta puntual (ver
 * `modules/cobros/use-cases/ajustar-aplicaciones-boleta.ts`).
 */
@injectable()
export class UpdateVentaItem {
  constructor(
    @inject(DI_TYPES.VentaRepository) private readonly ventaRepository: VentaRepository,
    @inject(DI_TYPES.CobroRepository) private readonly cobroRepository: CobroRepository,
  ) {}

  async execute(input: UpdateVentaItemInput): Promise<Venta> {
    const venta = await this.ventaRepository.getById(input.id, input.empresaId);
    if (!venta) {
      throw new ApiError("Venta no encontrada", Code.NOT_FOUND);
    }

    if (input.kg !== undefined) {
      const esCompensacion = venta.formaVenta === FormaVenta.COMPENSACION_KG;
      if (esCompensacion && input.kg >= 0) {
        throw new ApiError("La compensación tiene que ser negativa", Code.BAD_REQUEST);
      }
      if (!esCompensacion && input.kg <= 0) {
        throw new ApiError("kg tiene que ser mayor a 0", Code.BAD_REQUEST);
      }
    }

    const nuevoKg = input.kg ?? venta.kg;
    const nuevoTotal = venta.precioKg !== null ? Math.round(nuevoKg * venta.precioKg * 100) / 100 : null;

    const actualizada = await this.ventaRepository.update(input.id, input.empresaId, {
      garron: input.garron,
      kg: input.kg,
      categoria: input.categoria,
      comentarios: input.comentarios,
      total: input.kg !== undefined ? nuevoTotal : undefined,
    });

    if (venta.boletaId && input.kg !== undefined) {
      await this.reajustarBoleta(venta.boletaId, venta.clienteId, input.empresaId);
    }

    return actualizada;
  }

  private async reajustarBoleta(boletaId: string, clienteId: string, empresaId: string): Promise<void> {
    const ventasBoleta = await this.ventaRepository.listByBoleta(boletaId, empresaId);
    const { monto } = calcularMontoBoleta(ventasBoleta);
    await ajustarAplicacionesBoleta(this.cobroRepository, {
      boletaId,
      clienteId,
      empresaId,
      nuevoMontoMax: monto,
    });
  }
}
