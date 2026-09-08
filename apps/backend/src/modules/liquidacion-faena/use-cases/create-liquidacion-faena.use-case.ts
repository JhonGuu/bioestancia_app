import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { Logger } from "@/shared/infra/logger/logger";
import { LiquidacionFaena } from "@/modules/liquidacion-faena/domain/liquidacion-faena";
import { LiquidacionFaenaRepository } from "@/modules/liquidacion-faena/domain/liquidacion-faena.repository";
import { CompraRepository } from "@/modules/compras/domain/compra.repository";
import { CompraCategoriaRepository } from "@/modules/compras/domain/compra-categoria.repository";
import { CompraCategoria } from "@/modules/compras/domain/compra-categoria";
import { GenerarAsientosAutomaticos } from "@/modules/contabilidad/use-cases/generar-asientos-automaticos.use-case";
import { EventoAsiento } from "@/modules/contabilidad/domain/regla-asiento";

export interface CreateLiquidacionFaenaCategoriaUseCaseInput {
  compraCategoriaId: string;
  /** $/animal para esta categoría — ya combina lo facturado + lo efectivo. */
  canonPorAnimal: number;
}

export interface CreateLiquidacionFaenaUseCaseInput {
  empresaId: string;
  compraId: string;
  frigorificoId?: string;
  fecha: Date;
  comentarios?: string;
  categorias: CreateLiquidacionFaenaCategoriaUseCaseInput[];
}

export interface LiquidacionFaenaConCategorias extends LiquidacionFaena {
  categorias: CompraCategoria[];
}

/**
 * Carga la liquidación de faena de una compra (lo que el FRIGORÍFICO cobra
 * por faenar) y, con eso, completa el canon de cada línea de
 * `compra_categorias` correspondiente.
 *
 * `canonFaenaSubtotal` de cada línea se calcula en el server como
 * `cabezas × canonPorAnimal` (las cabezas ya viven en la línea, cargadas al
 * crear la compra) — `total` del header es la suma de esos subtotales.
 * Ninguno de los dos se recibe del cliente HTTP.
 */
@injectable()
export class CreateLiquidacionFaena {
  constructor(
    @inject(DI_TYPES.LiquidacionFaenaRepository)
    private readonly liquidacionFaenaRepository: LiquidacionFaenaRepository,
    @inject(DI_TYPES.CompraRepository) private readonly compraRepository: CompraRepository,
    @inject(DI_TYPES.CompraCategoriaRepository)
    private readonly compraCategoriaRepository: CompraCategoriaRepository,
    @inject(DI_TYPES.GenerarAsientosAutomaticos) private readonly generarAsientosAutomaticos: GenerarAsientosAutomaticos,
    @inject(DI_TYPES.Logger) private readonly logger: Logger,
  ) {}

  async execute(input: CreateLiquidacionFaenaUseCaseInput): Promise<LiquidacionFaenaConCategorias> {
    const compra = await this.compraRepository.getById(input.compraId, input.empresaId);
    if (!compra) {
      throw new ApiError("Compra no encontrada", Code.NOT_FOUND);
    }

    const yaExiste = await this.liquidacionFaenaRepository.getByCompraId(input.compraId, input.empresaId);
    if (yaExiste) {
      throw new ApiError("Esta compra ya tiene una liquidación de faena cargada", Code.BAD_REQUEST);
    }

    const categoriasDeLaCompra = await this.compraCategoriaRepository.listByCompra(input.compraId);
    const categoriasPorId = new Map(categoriasDeLaCompra.map((c) => [c.id, c]));
    for (const linea of input.categorias) {
      if (!categoriasPorId.has(linea.compraCategoriaId)) {
        throw new ApiError(
          `La categoría ${linea.compraCategoriaId} no pertenece a esta compra`,
          Code.BAD_REQUEST,
        );
      }
    }

    const categoriasActualizadas: CompraCategoria[] = [];
    let total = 0;
    for (const linea of input.categorias) {
      const categoria = categoriasPorId.get(linea.compraCategoriaId);
      if (!categoria) continue;
      const subtotal = Math.round(categoria.cabezas * linea.canonPorAnimal * 100) / 100;
      total += subtotal;
      const actualizada = await this.compraCategoriaRepository.actualizarCanonFaena(linea.compraCategoriaId, {
        canonFaenaPorAnimal: linea.canonPorAnimal,
        canonFaenaSubtotal: subtotal,
      });
      categoriasActualizadas.push(actualizada);
    }
    total = Math.round(total * 100) / 100;

    const liquidacion = await this.liquidacionFaenaRepository.create({
      empresaId: input.empresaId,
      compraId: input.compraId,
      frigorificoId: input.frigorificoId,
      fecha: input.fecha,
      comentarios: input.comentarios,
      total,
    });

    // Asiento automático (fase 2) — solo si hay frigorífico cargado (per
    // decisión: sin frigorífico no se genera el asiento, se avisa nomás).
    if (liquidacion.frigorificoId) {
      const { advertencia } = await this.generarAsientosAutomaticos.execute({
        empresaId: input.empresaId,
        evento: EventoAsiento.LIQUIDACION_FAENA,
        origenId: liquidacion.id,
        fecha: liquidacion.fecha,
        descripcion: `Liquidación de faena (compra Nº ${compra.numero})`,
        unidades: [{ frigorificoId: liquidacion.frigorificoId, total: liquidacion.total }],
      });
      if (advertencia) this.logger.warn(advertencia);
    }

    return { ...liquidacion, categorias: categoriasActualizadas };
  }
}
