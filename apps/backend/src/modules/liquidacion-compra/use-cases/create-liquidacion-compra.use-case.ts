import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { Logger } from "@/shared/infra/logger/logger";
import { LiquidacionCompra } from "@/modules/liquidacion-compra/domain/liquidacion-compra";
import { LiquidacionCompraRepository } from "@/modules/liquidacion-compra/domain/liquidacion-compra.repository";
import { CompraRepository } from "@/modules/compras/domain/compra.repository";
import { CompraCategoriaRepository } from "@/modules/compras/domain/compra-categoria.repository";
import { CompraCategoria } from "@/modules/compras/domain/compra-categoria";
import { GenerarAsientosAutomaticos } from "@/modules/contabilidad/use-cases/generar-asientos-automaticos.use-case";
import { EventoAsiento } from "@/modules/contabilidad/domain/regla-asiento";

export interface CreateLiquidacionCompraCategoriaUseCaseInput {
  compraCategoriaId: string;
  precioKg: number;
  porcentajeIva: number;
}

export interface CreateLiquidacionCompraUseCaseInput {
  empresaId: string;
  compraId: string;
  numeroComprobante: string;
  fecha: Date;
  fechaOperacion?: Date;
  cae?: string;
  fechaVencimientoCae?: Date;
  totalGastos?: number;
  ivaSobreGastos?: number;
  totalTributos?: number;
  comentarios?: string;
  categorias: CreateLiquidacionCompraCategoriaUseCaseInput[];
}

export interface LiquidacionCompraConCategorias extends LiquidacionCompra {
  categorias: CompraCategoria[];
}

/**
 * Emite la liquidación de compra (comprobante que se le manda al criadero)
 * de una compra que ya tiene resultado de faena cargado.
 *
 * Se factura sobre `kgVivoFaena` de cada línea (el kg vivo verificado en
 * planta), no sobre `pesoBruto` de compra ni `pesoNeto` — así es como sale
 * el comprobante real de AFIP. Por eso cada categoría tiene que tener ya su
 * `kgVivoFaena` cargado (`ResultadoFaena` previo), sino no se puede liquidar.
 *
 * `importeBruto`/`ivaSobreBruto`/`importeNeto` del header se calculan en el
 * server, nunca se reciben del cliente HTTP.
 */
@injectable()
export class CreateLiquidacionCompra {
  constructor(
    @inject(DI_TYPES.LiquidacionCompraRepository)
    private readonly liquidacionCompraRepository: LiquidacionCompraRepository,
    @inject(DI_TYPES.CompraRepository) private readonly compraRepository: CompraRepository,
    @inject(DI_TYPES.CompraCategoriaRepository)
    private readonly compraCategoriaRepository: CompraCategoriaRepository,
    @inject(DI_TYPES.GenerarAsientosAutomaticos) private readonly generarAsientosAutomaticos: GenerarAsientosAutomaticos,
    @inject(DI_TYPES.Logger) private readonly logger: Logger,
  ) {}

  async execute(input: CreateLiquidacionCompraUseCaseInput): Promise<LiquidacionCompraConCategorias> {
    const compra = await this.compraRepository.getById(input.compraId, input.empresaId);
    if (!compra) {
      throw new ApiError("Compra no encontrada", Code.NOT_FOUND);
    }

    const yaExiste = await this.liquidacionCompraRepository.getByCompraId(
      input.compraId,
      input.empresaId,
    );
    if (yaExiste) {
      throw new ApiError("Esta compra ya tiene una liquidación cargada", Code.BAD_REQUEST);
    }

    const categoriasDeLaCompra = await this.compraCategoriaRepository.listByCompra(input.compraId);
    const categoriasPorId = new Map(categoriasDeLaCompra.map((c) => [c.id, c]));

    let importeBrutoTotal = 0;
    let ivaSobreBrutoTotal = 0;
    const categoriasActualizadas: CompraCategoria[] = [];

    for (const linea of input.categorias) {
      const categoria = categoriasPorId.get(linea.compraCategoriaId);
      if (!categoria) {
        throw new ApiError(
          `La categoría ${linea.compraCategoriaId} no pertenece a esta compra`,
          Code.BAD_REQUEST,
        );
      }
      if (categoria.kgVivoFaena === null) {
        throw new ApiError(
          `La categoría "${categoria.categoria}" todavía no tiene resultado de faena cargado — ` +
            "no se puede liquidar hasta cargarlo",
          Code.BAD_REQUEST,
        );
      }

      const importeBruto = Math.round(categoria.kgVivoFaena * linea.precioKg * 100) / 100;
      const importeIva = Math.round(importeBruto * (linea.porcentajeIva / 100) * 100) / 100;
      importeBrutoTotal += importeBruto;
      ivaSobreBrutoTotal += importeIva;

      const actualizada = await this.compraCategoriaRepository.actualizarLiquidacion(
        linea.compraCategoriaId,
        {
          precioKg: linea.precioKg,
          importeBruto,
          porcentajeIva: linea.porcentajeIva,
          importeIva,
        },
      );
      categoriasActualizadas.push(actualizada);
    }

    importeBrutoTotal = Math.round(importeBrutoTotal * 100) / 100;
    ivaSobreBrutoTotal = Math.round(ivaSobreBrutoTotal * 100) / 100;
    const importeNeto =
      Math.round(
        (importeBrutoTotal +
          ivaSobreBrutoTotal +
          (input.totalGastos ?? 0) +
          (input.ivaSobreGastos ?? 0) +
          (input.totalTributos ?? 0)) *
          100,
      ) / 100;

    const liquidacion = await this.liquidacionCompraRepository.create({
      empresaId: input.empresaId,
      compraId: input.compraId,
      numeroComprobante: input.numeroComprobante,
      fecha: input.fecha,
      fechaOperacion: input.fechaOperacion,
      cae: input.cae,
      fechaVencimientoCae: input.fechaVencimientoCae,
      importeBruto: importeBrutoTotal,
      ivaSobreBruto: ivaSobreBrutoTotal,
      totalGastos: input.totalGastos,
      ivaSobreGastos: input.ivaSobreGastos,
      totalTributos: input.totalTributos,
      importeNeto,
      comentarios: input.comentarios,
    });

    const { advertencia } = await this.generarAsientosAutomaticos.execute({
      empresaId: input.empresaId,
      evento: EventoAsiento.LIQUIDACION_COMPRA,
      origenId: liquidacion.id,
      fecha: liquidacion.fecha,
      descripcion: `Liquidación de compra Nº ${liquidacion.numeroComprobante}`,
      unidades: [
        {
          proveedorId: compra.proveedorId,
          importeBruto: importeBrutoTotal,
          importeIva: ivaSobreBrutoTotal,
          totalGastos: input.totalGastos ?? 0,
          ivaSobreGastos: input.ivaSobreGastos ?? 0,
          totalTributos: input.totalTributos ?? 0,
        },
      ],
    });
    if (advertencia) this.logger.warn(advertencia);

    return { ...liquidacion, categorias: categoriasActualizadas };
  }
}
