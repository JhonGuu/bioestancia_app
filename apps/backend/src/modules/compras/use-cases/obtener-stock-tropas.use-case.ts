import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { CompraRepository } from "@/modules/compras/domain/compra.repository";
import { CompraCategoriaRepository } from "@/modules/compras/domain/compra-categoria.repository";
import { StockTropa } from "@/modules/compras/domain/stock-tropa";
import { VentaRepository } from "@/modules/ventas/domain/venta.repository";
import { FormaVenta } from "@/modules/ventas/domain/forma-venta";

export interface ObtenerStockTropasInput {
  empresaId: string;
}

/**
 * Stock TEÓRICO de cada tropa abierta (no cerrada): cabezas compradas menos
 * cabezas ya vendidas. No hay "conteo real" del operario todavía — es
 * puramente lo que se puede reconstruir de `compras`/`ventas` (ver decisión
 * de negocio: "solo el teórico por ahora").
 *
 * Mismo criterio de reconciliación que `CerrarCompra`: cabezas vendidas =
 * garrones DISTINTOS en `ventas` (no filas — una media res es una fila, un
 * garrón puede tener 2), sin contar `compensacion_kg` (no tiene garrón real).
 *
 * Solo devuelve tropas NO cerradas — una vez cerrada, ya se reconcilió
 * (debería quedar en 0) y no aporta como "stock pendiente de entregar".
 */
@injectable()
export class ObtenerStockTropas {
  constructor(
    @inject(DI_TYPES.CompraRepository) private readonly compraRepository: CompraRepository,
    @inject(DI_TYPES.CompraCategoriaRepository)
    private readonly compraCategoriaRepository: CompraCategoriaRepository,
    @inject(DI_TYPES.VentaRepository) private readonly ventaRepository: VentaRepository,
  ) {}

  async execute(input: ObtenerStockTropasInput): Promise<StockTropa[]> {
    const compras = await this.compraRepository.list(input.empresaId);
    const abiertas = compras.filter((c) => !c.cerrada);

    const resultado: StockTropa[] = [];
    for (const compra of abiertas) {
      const categorias = await this.compraCategoriaRepository.listByCompra(compra.id);
      const cabezasCompradas = categorias.reduce((acc, c) => acc + c.cabezas, 0);

      const ventasDeLaCompra = await this.ventaRepository.listByCompra(compra.id, input.empresaId);
      const garronesDistintos = new Set(
        ventasDeLaCompra
          .filter((v) => v.formaVenta !== FormaVenta.COMPENSACION_KG && v.garron !== null)
          .map((v) => v.garron),
      );
      const cabezasVendidas = garronesDistintos.size;

      resultado.push({
        ...compra,
        cabezasCompradas,
        cabezasVendidas,
        stockRestante: cabezasCompradas - cabezasVendidas,
        categorias: categorias.map((c) => ({ categoria: c.categoria, cabezas: c.cabezas })),
      });
    }

    return resultado;
  }
}
