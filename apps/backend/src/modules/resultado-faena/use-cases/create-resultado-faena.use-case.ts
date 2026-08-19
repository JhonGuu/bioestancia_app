import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { ResultadoFaena } from "@/modules/resultado-faena/domain/resultado-faena";
import { ResultadoFaenaRepository } from "@/modules/resultado-faena/domain/resultado-faena.repository";
import { CompraRepository } from "@/modules/compras/domain/compra.repository";
import { CompraCategoriaRepository } from "@/modules/compras/domain/compra-categoria.repository";
import { CompraCategoria } from "@/modules/compras/domain/compra-categoria";

export interface CreateResultadoFaenaCategoriaUseCaseInput {
  compraCategoriaId: string;
  kgVivoFaena: number;
  kgCarne: number;
  porcentajeMagro?: number;
  destinoComercial?: string;
  cuartosDelantero?: number;
  cuartosTrasero?: number;
  /** Decomiso sanitario atribuido a ESTA categoría — 0 si no se manda. */
  comisosCabezas?: number;
  comisosKg?: number;
}

export interface CreateResultadoFaenaUseCaseInput {
  empresaId: string;
  compraId: string;
  frigorificoId?: string;
  fechaFaena: Date;
  numero?: string;
  numeroAutorizacion?: string;
  comentarios?: string;
  categorias: CreateResultadoFaenaCategoriaUseCaseInput[];
}

export interface ResultadoFaenaConCategorias extends ResultadoFaena {
  categorias: CompraCategoria[];
}

/**
 * Carga el resultado de faena de una compra (documento SENASA que entrega el
 * frigorífico) y, con eso, completa los campos de faena de cada línea de
 * `compra_categorias` correspondiente.
 *
 * `kgVivoTotal`/`kgCarneTotal`/`rendimiento` del header se calculan en el
 * server como suma/cociente de las líneas — nunca se reciben del cliente
 * HTTP (mismo criterio que `pesoNeto` en compras o `total` en ventas).
 */
@injectable()
export class CreateResultadoFaena {
  constructor(
    @inject(DI_TYPES.ResultadoFaenaRepository)
    private readonly resultadoFaenaRepository: ResultadoFaenaRepository,
    @inject(DI_TYPES.CompraRepository) private readonly compraRepository: CompraRepository,
    @inject(DI_TYPES.CompraCategoriaRepository)
    private readonly compraCategoriaRepository: CompraCategoriaRepository,
  ) {}

  async execute(input: CreateResultadoFaenaUseCaseInput): Promise<ResultadoFaenaConCategorias> {
    const compra = await this.compraRepository.getById(input.compraId, input.empresaId);
    if (!compra) {
      throw new ApiError("Compra no encontrada", Code.NOT_FOUND);
    }

    const yaExiste = await this.resultadoFaenaRepository.getByCompraId(input.compraId, input.empresaId);
    if (yaExiste) {
      throw new ApiError("Esta compra ya tiene un resultado de faena cargado", Code.BAD_REQUEST);
    }

    const categoriasDeLaCompra = await this.compraCategoriaRepository.listByCompra(input.compraId);
    const idsValidos = new Set(categoriasDeLaCompra.map((c) => c.id));
    for (const linea of input.categorias) {
      if (!idsValidos.has(linea.compraCategoriaId)) {
        throw new ApiError(
          `La categoría ${linea.compraCategoriaId} no pertenece a esta compra`,
          Code.BAD_REQUEST,
        );
      }
    }

    const kgVivoTotal = Math.round(input.categorias.reduce((acc, c) => acc + c.kgVivoFaena, 0) * 100) / 100;
    const kgCarneTotal = Math.round(input.categorias.reduce((acc, c) => acc + c.kgCarne, 0) * 100) / 100;
    const rendimiento = Math.round((kgCarneTotal / kgVivoTotal) * 100 * 100) / 100;
    // Comisos del header: NO se reciben del cliente HTTP — se calculan sumando
    // el decomiso de cada línea (mismo criterio que kgVivoTotal/kgCarneTotal),
    // porque el frigorífico siempre atribuye el decomiso a una categoría
    // puntual, nunca a la tropa en general.
    const comisosCabezasTotal = input.categorias.reduce((acc, c) => acc + (c.comisosCabezas ?? 0), 0);
    const comisosKgTotal = Math.round(input.categorias.reduce((acc, c) => acc + (c.comisosKg ?? 0), 0) * 100) / 100;

    const categoriasActualizadas: CompraCategoria[] = [];
    for (const linea of input.categorias) {
      const actualizada = await this.compraCategoriaRepository.actualizarFaena(linea.compraCategoriaId, {
        kgVivoFaena: linea.kgVivoFaena,
        kgCarne: linea.kgCarne,
        porcentajeMagro: linea.porcentajeMagro ?? null,
        destinoComercial: linea.destinoComercial ?? null,
        cuartosDelantero: linea.cuartosDelantero ?? null,
        cuartosTrasero: linea.cuartosTrasero ?? null,
        comisosCabezas: linea.comisosCabezas ?? 0,
        comisosKg: linea.comisosKg ?? 0,
      });
      categoriasActualizadas.push(actualizada);
    }

    const resultado = await this.resultadoFaenaRepository.create({
      empresaId: input.empresaId,
      compraId: input.compraId,
      frigorificoId: input.frigorificoId,
      fechaFaena: input.fechaFaena,
      numero: input.numero,
      numeroAutorizacion: input.numeroAutorizacion,
      kgVivoTotal,
      kgCarneTotal,
      comisosKg: comisosKgTotal,
      comisosCabezas: comisosCabezasTotal,
      rendimiento,
      comentarios: input.comentarios,
    });

    return { ...resultado, categorias: categoriasActualizadas };
  }
}
