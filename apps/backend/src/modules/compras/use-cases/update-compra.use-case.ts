import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { CompraRepository } from "@/modules/compras/domain/compra.repository";
import { CompraCategoriaRepository } from "@/modules/compras/domain/compra-categoria.repository";
import { CompraConCategorias } from "@/modules/compras/use-cases/create-compra.use-case";
import { EspecieAnimal } from "@/modules/compras/domain/especie-animal";
import { CategoriaPorcino } from "@/modules/compras/domain/categoria-porcino";
import { RazaPorcino } from "@/modules/compras/domain/raza-porcino";
import { ProveedorRepository } from "@/modules/proveedores/domain/proveedor.repository";

export interface UpdateCompraCategoriaUseCaseInput {
  /** Si viene y coincide con una línea existente, la actualiza; si no, crea una nueva. */
  id?: string;
  categoria: CategoriaPorcino;
  raza?: RazaPorcino;
  cabezas: number;
}

export interface UpdateCompraUseCaseInput {
  id: string;
  empresaId: string;
  proveedorId?: string;
  especie?: EspecieAnimal;
  numero?: string;
  letra?: string;
  fecha?: Date;
  dte?: string;
  remito?: string;
  porcentajeDesbaste?: number;
  /** Kg vivo de báscula de la tropa entera — si cambia, se recalcula `pesoNeto`. */
  pesoBruto?: number;
  comentarios?: string;
  /**
   * Si viene, reemplaza el detalle de categorías/razas/cabezas de la compra
   * (sincroniza contra las líneas existentes — ver `syncForCompra`). Si no
   * viene, el detalle actual queda intacto.
   */
  categorias?: UpdateCompraCategoriaUseCaseInput[];
}

/**
 * Edita una compra completa: proveedor, especie, datos generales y el
 * detalle de categorías/razas/cabezas.
 *
 * Bloqueada si la compra ya está cerrada — una vez cerrada, `pesoFinalVenta`
 * y `rinde` quedan calculados en base al `pesoNeto` y las cabezas de ese
 * momento; dejar editar después dejaría esos números desactualizados sin que
 * nadie se dé cuenta. Hay que reabrir la compra primero (`ReabrirCompra`).
 */
@injectable()
export class UpdateCompra {
  constructor(
    @inject(DI_TYPES.CompraRepository) private readonly compraRepository: CompraRepository,
    @inject(DI_TYPES.CompraCategoriaRepository)
    private readonly compraCategoriaRepository: CompraCategoriaRepository,
    @inject(DI_TYPES.ProveedorRepository) private readonly proveedorRepository: ProveedorRepository,
  ) {}

  async execute(input: UpdateCompraUseCaseInput): Promise<CompraConCategorias> {
    const compra = await this.compraRepository.getById(input.id, input.empresaId);
    if (!compra) {
      throw new ApiError("Compra no encontrada", Code.NOT_FOUND);
    }
    if (compra.cerrada) {
      throw new ApiError(
        "No se puede editar una compra cerrada. Reabrila primero.",
        Code.BAD_REQUEST,
      );
    }

    if (input.proveedorId !== undefined) {
      const proveedor = await this.proveedorRepository.getById(input.proveedorId, input.empresaId);
      if (!proveedor) {
        throw new ApiError("Proveedor no encontrado", Code.NOT_FOUND);
      }
    }

    const porcentajeDesbaste = input.porcentajeDesbaste ?? compra.porcentajeDesbaste;
    const pesoBruto = input.pesoBruto ?? compra.pesoBruto;
    // Redondeo a 2 decimales para no arrastrar error de punto flotante al guardar.
    const pesoNeto = Math.round(pesoBruto * (1 - porcentajeDesbaste / 100) * 100) / 100;

    const compraActualizada = await this.compraRepository.update(input.id, input.empresaId, {
      proveedorId: input.proveedorId,
      especie: input.especie,
      numero: input.numero,
      letra: input.letra,
      fecha: input.fecha,
      dte: input.dte,
      remito: input.remito,
      porcentajeDesbaste: input.porcentajeDesbaste,
      pesoBruto: input.pesoBruto,
      pesoNeto,
      comentarios: input.comentarios,
    });

    const categorias = input.categorias
      ? await this.compraCategoriaRepository.syncForCompra(
          input.id,
          input.categorias.map((linea) => ({
            id: linea.id,
            categoria: linea.categoria,
            raza: linea.raza,
            cabezas: linea.cabezas,
          })),
        )
      : await this.compraCategoriaRepository.listByCompra(input.id);

    return { ...compraActualizada, categorias };
  }
}
