import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { Compra } from "@/modules/compras/domain/compra";
import { CompraRepository } from "@/modules/compras/domain/compra.repository";
import { CompraCategoriaRepository } from "@/modules/compras/domain/compra-categoria.repository";
import { VentaRepository } from "@/modules/ventas/domain/venta.repository";
import { FormaVenta } from "@/modules/ventas/domain/forma-venta";
import { GrupoTropasRepository } from "@/modules/grupos-tropas/domain/grupo-tropas.repository";

export interface CerrarCompraInput {
  id: string;
  empresaId: string;
}

/**
 * Cierra una compra SIN grupo: reconcilia las cabezas vendidas contra las
 * compradas y calcula el rinde.
 *
 * "Cabezas compradas" NO es un escalar del header de `Compra` — es la suma
 * de las líneas de `compra_categorias` (el remito/DTE real viene separado
 * por categoría/raza, ver `domain/compra-categoria.ts`). "Peso neto
 * comprado" en cambio SÍ es un escalar de `Compra` (`pesoNeto`, calculado al
 * crear la compra) — no se puede sumar por categoría porque el peso recién
 * se discrimina por categoría al armar la liquidación de compra, que puede
 * no haberse hecho todavía cuando se cierra la compra.
 *
 * "Cabezas vendidas" = garrones DISTINTOS en `ventas` para esa compra (no
 * filas: cada garrón tiene 2 medias reses, pueden estar en 2 filas separadas).
 * Las filas de `compensacion_kg` no cuentan como cabeza (no tienen garrón).
 *
 * Si las cabezas vendidas son MENOS que las compradas, se bloquea el cierre
 * (todavía no se despachó del todo). Si son MÁS (superávit — típicamente
 * falta un DTE por un animal adicional, ver `plan-unificacion-tropas-despacho.md`),
 * NO se bloquea: se cierra igual con `alertaSuperavit: true` como aviso.
 *
 * Si la compra pertenece a un grupo de tropas TODAVÍA ABIERTO, se rechaza el
 * cierre individual — esa tropa se cierra únicamente cerrando el grupo
 * completo (`CerrarGrupoTropas`), porque la reconciliación ahí es sobre la
 * suma de todas las tropas del grupo, no tropa por tropa.
 */
@injectable()
export class CerrarCompra {
  constructor(
    @inject(DI_TYPES.CompraRepository) private readonly compraRepository: CompraRepository,
    @inject(DI_TYPES.CompraCategoriaRepository)
    private readonly compraCategoriaRepository: CompraCategoriaRepository,
    @inject(DI_TYPES.VentaRepository) private readonly ventaRepository: VentaRepository,
    @inject(DI_TYPES.GrupoTropasRepository) private readonly grupoTropasRepository: GrupoTropasRepository,
  ) {}

  async execute(input: CerrarCompraInput): Promise<Compra> {
    const compra = await this.compraRepository.getById(input.id, input.empresaId);
    if (!compra) {
      throw new ApiError("Compra no encontrada", Code.NOT_FOUND);
    }
    if (compra.cerrada) {
      throw new ApiError("La compra ya está cerrada", Code.BAD_REQUEST);
    }
    if (compra.grupoTropasId !== null) {
      const grupo = await this.grupoTropasRepository.getById(compra.grupoTropasId, input.empresaId);
      if (grupo && !grupo.cerrado) {
        throw new ApiError(
          "Esta tropa pertenece a un grupo de tropas abierto — cerrala desde el grupo completo.",
          Code.BAD_REQUEST,
        );
      }
    }

    const categorias = await this.compraCategoriaRepository.listByCompra(compra.id);
    const cantidadAnimales = categorias.reduce((acc, c) => acc + c.cabezas, 0);

    const ventasDeLaCompra = await this.ventaRepository.listByCompra(compra.id, input.empresaId);

    const garronesDistintos = new Set(
      ventasDeLaCompra
        .filter((v) => v.formaVenta !== FormaVenta.COMPENSACION_KG && v.garron !== null)
        .map((v) => v.garron),
    );
    const cabezasVendidas = garronesDistintos.size;

    if (cabezasVendidas < cantidadAnimales) {
      throw new ApiError(
        `Las cabezas vendidas (${cabezasVendidas}) son menos que las cabezas compradas ` +
          `(${cantidadAnimales}). No se puede cerrar la compra todavía.`,
        Code.BAD_REQUEST,
      );
    }
    const alertaSuperavit = cabezasVendidas > cantidadAnimales;

    const pesoFinalVenta = ventasDeLaCompra.reduce((acc, v) => acc + v.kg, 0);
    const rinde = Math.round((pesoFinalVenta / compra.pesoNeto) * 100 * 100) / 100;

    return this.compraRepository.cerrar(compra.id, input.empresaId, {
      pesoFinalVenta: Math.round(pesoFinalVenta * 100) / 100,
      rinde,
      alertaSuperavit,
      fechaCierre: new Date(),
    });
  }
}
