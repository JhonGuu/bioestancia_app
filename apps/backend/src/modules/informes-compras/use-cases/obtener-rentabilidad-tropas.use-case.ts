import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { CompraRepository } from "@/modules/compras/domain/compra.repository";
import { LiquidacionCompraRepository } from "@/modules/liquidacion-compra/domain/liquidacion-compra.repository";
import { LiquidacionFaenaRepository } from "@/modules/liquidacion-faena/domain/liquidacion-faena.repository";
import { VentaRepository } from "@/modules/ventas/domain/venta.repository";
import { RentabilidadTropa } from "@/modules/informes-compras/domain/rentabilidad-tropa";

export interface ObtenerRentabilidadTropasInput {
  empresaId: string;
}

function agruparPor<T>(items: T[], claveDe: (item: T) => string): Map<string, T[]> {
  const mapa = new Map<string, T[]>();
  for (const item of items) {
    const clave = claveDe(item);
    const arr = mapa.get(clave) ?? [];
    arr.push(item);
    mapa.set(clave, arr);
  }
  return mapa;
}

/**
 * Rentabilidad de cada tropa de la empresa activa, de una sola pasada — trae
 * compras/liquidaciones de compra/liquidaciones de faena/ventas de TODA la
 * empresa con `Promise.all` y agrupa en memoria (mismo patrón que
 * `ObtenerSaldosClientes`), en vez de hacer 3 consultas por tropa.
 */
@injectable()
export class ObtenerRentabilidadTropas {
  constructor(
    @inject(DI_TYPES.CompraRepository) private readonly compraRepository: CompraRepository,
    @inject(DI_TYPES.LiquidacionCompraRepository)
    private readonly liquidacionCompraRepository: LiquidacionCompraRepository,
    @inject(DI_TYPES.LiquidacionFaenaRepository)
    private readonly liquidacionFaenaRepository: LiquidacionFaenaRepository,
    @inject(DI_TYPES.VentaRepository) private readonly ventaRepository: VentaRepository,
  ) {}

  async execute(input: ObtenerRentabilidadTropasInput): Promise<RentabilidadTropa[]> {
    const [compras, liquidacionesCompra, liquidacionesFaena, ventas] = await Promise.all([
      this.compraRepository.list(input.empresaId),
      this.liquidacionCompraRepository.list(input.empresaId),
      this.liquidacionFaenaRepository.list(input.empresaId),
      this.ventaRepository.list(input.empresaId),
    ]);

    const liquidacionCompraPorTropa = new Map(liquidacionesCompra.map((l) => [l.compraId, l]));
    const liquidacionFaenaPorTropa = new Map(liquidacionesFaena.map((l) => [l.compraId, l]));
    const ventasPorTropa = agruparPor(
      ventas.filter((v) => v.compraId !== null),
      (v) => v.compraId as string,
    );

    return compras
      .filter((compra) => compra.activo)
      .map((compra) => {
        const liquidacionCompra = liquidacionCompraPorTropa.get(compra.id) ?? null;
        const liquidacionFaena = liquidacionFaenaPorTropa.get(compra.id) ?? null;
        const ventasDeTropa = ventasPorTropa.get(compra.id) ?? [];

        const ingresoVenta =
          Math.round(ventasDeTropa.reduce((acc, v) => acc + (v.total ?? 0), 0) * 100) / 100;

        const costoCompra = liquidacionCompra?.importeNeto ?? null;
        const costoFaena = liquidacionFaena?.total ?? null;
        const costoTotal =
          costoCompra !== null || costoFaena !== null ? (costoCompra ?? 0) + (costoFaena ?? 0) : null;
        const ganancia = costoTotal !== null ? Math.round((ingresoVenta - costoTotal) * 100) / 100 : null;
        const rentabilidadPorcentaje =
          costoTotal !== null && costoTotal > 0 && ganancia !== null
            ? Math.round((ganancia / costoTotal) * 100 * 100) / 100
            : null;

        const rentabilidad: RentabilidadTropa = {
          compraId: compra.id,
          numero: compra.numero,
          letra: compra.letra,
          fecha: compra.fecha,
          proveedorId: compra.proveedorId,
          cerrada: compra.cerrada,
          costoCompra,
          costoFaena,
          costoTotal,
          ingresoVenta,
          ganancia,
          rentabilidadPorcentaje,
        };
        return rentabilidad;
      })
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  }
}
