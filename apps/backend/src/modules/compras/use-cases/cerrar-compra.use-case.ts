import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { Compra } from "@/modules/compras/domain/compra";
import { CompraRepository } from "@/modules/compras/domain/compra.repository";
import { CompraCategoriaRepository } from "@/modules/compras/domain/compra-categoria.repository";
import { VentaRepository } from "@/modules/ventas/domain/venta.repository";
import { FormaVenta } from "@/modules/ventas/domain/forma-venta";

export interface CerrarCompraInput {
  id: string;
  empresaId: string;
}

/**
 * Cierra una compra: reconcilia las cabezas vendidas contra las compradas y,
 * si coinciden, calcula el rinde.
 *
 * "Cabezas compradas" y "peso neto comprado" ya NO son escalares del header
 * de `Compra` — son la suma de las líneas de `compra_categorias` (el
 * remito/DTE real viene separado por categoría/raza, ver
 * `domain/compra-categoria.ts`).
 *
 * "Cabezas vendidas" = garrones DISTINTOS en `ventas` para esa compra (no
 * filas: cada garrón tiene 2 medias reses, pueden estar en 2 filas separadas).
 * Las filas de `compensacion_kg` no cuentan como cabeza (no tienen garrón).
 *
 * Si las cabezas vendidas no coinciden EXACTO con la suma de cabezas
 * compradas, se bloquea el cierre — no hay forma de cerrar "con diferencia"
 * en esta versión (ver decisión de negocio).
 */
@injectable()
export class CerrarCompra {
  constructor(
    @inject(DI_TYPES.CompraRepository) private readonly compraRepository: CompraRepository,
    @inject(DI_TYPES.CompraCategoriaRepository)
    private readonly compraCategoriaRepository: CompraCategoriaRepository,
    @inject(DI_TYPES.VentaRepository) private readonly ventaRepository: VentaRepository,
  ) {}

  async execute(input: CerrarCompraInput): Promise<Compra> {
    const compra = await this.compraRepository.getById(input.id, input.empresaId);
    if (!compra) {
      throw new ApiError("Compra no encontrada", Code.NOT_FOUND);
    }
    if (compra.cerrada) {
      throw new ApiError("La compra ya está cerrada", Code.BAD_REQUEST);
    }

    const categorias = await this.compraCategoriaRepository.listByCompra(compra.id);
    const cantidadAnimales = categorias.reduce((acc, c) => acc + c.cabezas, 0);
    const pesoNetoTotal = categorias.reduce((acc, c) => acc + c.pesoNeto, 0);

    const ventasDeLaCompra = await this.ventaRepository.listByCompra(compra.id, input.empresaId);

    const garronesDistintos = new Set(
      ventasDeLaCompra
        .filter((v) => v.formaVenta !== FormaVenta.COMPENSACION_KG && v.garron !== null)
        .map((v) => v.garron),
    );
    const cabezasVendidas = garronesDistintos.size;

    if (cabezasVendidas !== cantidadAnimales) {
      throw new ApiError(
        `Las cabezas vendidas (${cabezasVendidas}) no coinciden con las cabezas compradas ` +
          `(${cantidadAnimales}). No se puede cerrar la compra.`,
        Code.BAD_REQUEST,
      );
    }

    const pesoFinalVenta = ventasDeLaCompra.reduce((acc, v) => acc + v.kg, 0);
    const rinde = Math.round((pesoFinalVenta / pesoNetoTotal) * 100 * 100) / 100;

    return this.compraRepository.cerrar(compra.id, input.empresaId, {
      pesoFinalVenta: Math.round(pesoFinalVenta * 100) / 100,
      rinde,
      fechaCierre: new Date(),
    });
  }
}
