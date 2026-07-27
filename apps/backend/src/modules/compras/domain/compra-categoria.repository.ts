import { CompraCategoria } from "@/modules/compras/domain/compra-categoria";

export interface CompraCategoriaRepository {
  /** Lista las líneas de categoría de una compra, en el orden en que se cargaron. */
  listByCompra(compraId: string): Promise<CompraCategoria[]>;

  getById(id: string): Promise<CompraCategoria | null>;

  /** Crea todas las líneas de una compra de una sola vez (siempre al crear la compra). */
  createMany(input: CreateCompraCategoriaInput[]): Promise<CompraCategoria[]>;

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
  categoria: string;
  raza?: string;
  cabezas: number;
  pesoBruto: number;
  pesoNeto: number;
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
