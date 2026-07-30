import { CompraCategoria } from "@/modules/compras/domain/compra-categoria";
import { CategoriaPorcino } from "@/modules/compras/domain/categoria-porcino";
import { RazaPorcino } from "@/modules/compras/domain/raza-porcino";

export interface CompraCategoriaRepository {
  /** Lista las líneas de categoría de una compra, en el orden en que se cargaron. */
  listByCompra(compraId: string): Promise<CompraCategoria[]>;

  getById(id: string): Promise<CompraCategoria | null>;

  /** Crea todas las líneas de una compra de una sola vez (siempre al crear la compra). */
  createMany(input: CreateCompraCategoriaInput[]): Promise<CompraCategoria[]>;

  /**
   * Sincroniza el detalle de categorías de una compra contra un nuevo set de
   * líneas: actualiza (categoria/raza/cabezas) las que traen `id` y siguen
   * en la lista, borra las que ya no vienen, y crea las que no traen `id`.
   * Usado por `UpdateCompra` cuando se edita el detalle completo.
   */
  syncForCompra(compraId: string, lines: SyncCompraCategoriaLine[]): Promise<CompraCategoria[]>;

  /** Completa los campos de resultado de faena de una línea puntual. */
  actualizarFaena(id: string, input: ActualizarFaenaCompraCategoriaData): Promise<CompraCategoria>;

  /** Completa los campos de liquidación de una línea puntual. */
  actualizarLiquidacion(
    id: string,
    input: ActualizarLiquidacionCompraCategoriaData,
  ): Promise<CompraCategoria>;
}

export interface CreateCompraCategoriaInput {
  compraId: string;
  categoria: CategoriaPorcino;
  raza?: RazaPorcino;
  cabezas: number;
}

export interface SyncCompraCategoriaLine {
  /** Si viene y coincide con una línea existente, se actualiza esa línea; si no, se crea una nueva. */
  id?: string;
  categoria: CategoriaPorcino;
  raza?: RazaPorcino;
  cabezas: number;
}

export interface ActualizarFaenaCompraCategoriaData {
  kgVivoFaena: number;
  kgCarne: number;
  porcentajeMagro: number | null;
  destinoComercial: string | null;
  cuartosDelantero: number | null;
  cuartosTrasero: number | null;
}

export interface ActualizarLiquidacionCompraCategoriaData {
  precioKg: number;
  importeBruto: number;
  porcentajeIva: number;
  importeIva: number;
}
