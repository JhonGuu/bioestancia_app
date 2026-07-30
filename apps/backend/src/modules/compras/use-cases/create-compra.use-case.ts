import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { Compra } from "@/modules/compras/domain/compra";
import { CompraCategoria } from "@/modules/compras/domain/compra-categoria";
import { CompraRepository } from "@/modules/compras/domain/compra.repository";
import { CompraCategoriaRepository } from "@/modules/compras/domain/compra-categoria.repository";
import { EspecieAnimal } from "@/modules/compras/domain/especie-animal";
import { CategoriaPorcino } from "@/modules/compras/domain/categoria-porcino";
import { RazaPorcino } from "@/modules/compras/domain/raza-porcino";
import { ProveedorRepository } from "@/modules/proveedores/domain/proveedor.repository";

export interface CreateCompraCategoriaUseCaseInput {
  categoria: CategoriaPorcino;
  raza?: RazaPorcino;
  cabezas: number;
}

export interface CreateCompraUseCaseInput {
  empresaId: string;
  proveedorId: string;
  numero: string;
  especie: EspecieAnimal;
  letra?: string;
  fecha: Date;
  dte: string;
  remito: string;
  /** Si no se manda, se usa el `porcentajeDesbaste` por defecto del proveedor. */
  porcentajeDesbaste?: number;
  /**
   * Kg vivo de báscula de la tropa entera — se pesa una sola vez, no
   * discriminado por categoría (eso se hace después, al armar la
   * liquidación de compra).
   */
  pesoBruto: number;
  comentarios?: string;
  /** El remito/DTE real ya viene separado por categoría/raza — al menos una línea. */
  categorias: CreateCompraCategoriaUseCaseInput[];
}

export interface CompraConCategorias extends Compra {
  categorias: CompraCategoria[];
}

@injectable()
export class CreateCompra {
  constructor(
    @inject(DI_TYPES.CompraRepository) private readonly compraRepository: CompraRepository,
    @inject(DI_TYPES.CompraCategoriaRepository)
    private readonly compraCategoriaRepository: CompraCategoriaRepository,
    @inject(DI_TYPES.ProveedorRepository) private readonly proveedorRepository: ProveedorRepository,
  ) {}

  async execute(input: CreateCompraUseCaseInput): Promise<CompraConCategorias> {
    const porcentajeDesbaste = await this.resolvePorcentajeDesbaste(input);
    // Redondeo a 2 decimales para no arrastrar error de punto flotante al guardar.
    const pesoNeto = Math.round(input.pesoBruto * (1 - porcentajeDesbaste / 100) * 100) / 100;

    const compra = await this.compraRepository.create({
      empresaId: input.empresaId,
      proveedorId: input.proveedorId,
      numero: input.numero,
      especie: input.especie,
      letra: input.letra,
      fecha: input.fecha,
      dte: input.dte,
      remito: input.remito,
      porcentajeDesbaste,
      pesoBruto: input.pesoBruto,
      pesoNeto,
      comentarios: input.comentarios,
    });

    const categorias = await this.compraCategoriaRepository.createMany(
      input.categorias.map((linea) => ({
        compraId: compra.id,
        categoria: linea.categoria,
        raza: linea.raza,
        cabezas: linea.cabezas,
      })),
    );

    return { ...compra, categorias };
  }

  private async resolvePorcentajeDesbaste(input: CreateCompraUseCaseInput): Promise<number> {
    if (input.porcentajeDesbaste !== undefined) {
      return input.porcentajeDesbaste;
    }
    const proveedor = await this.proveedorRepository.getById(input.proveedorId, input.empresaId);
    if (!proveedor) {
      throw new ApiError("Proveedor no encontrado", Code.NOT_FOUND);
    }
    if (proveedor.porcentajeDesbaste === null) {
      throw new ApiError(
        "El proveedor no tiene un porcentajeDesbaste por defecto cargado — indicalo en la compra",
        Code.BAD_REQUEST,
      );
    }
    return proveedor.porcentajeDesbaste;
  }
}
