import { LiquidacionCompra } from "@/modules/liquidacion-compra/domain/liquidacion-compra";

export interface LiquidacionCompraRepository {
  getById(id: string, empresaId: string): Promise<LiquidacionCompra | null>;

  /** Una compra tiene a lo sumo una liquidación (relación 1 a 1). */
  getByCompraId(compraId: string, empresaId: string): Promise<LiquidacionCompra | null>;

  create(input: CreateLiquidacionCompraInput): Promise<LiquidacionCompra>;
}

export interface CreateLiquidacionCompraInput {
  empresaId: string;
  compraId: string;
  numeroComprobante: string;
  fecha: Date;
  fechaOperacion?: Date;
  cae?: string;
  fechaVencimientoCae?: Date;
  /** Siempre llegan calculados (suma de las líneas), nunca del cliente HTTP. */
  importeBruto: number;
  ivaSobreBruto: number;
  totalGastos?: number;
  ivaSobreGastos?: number;
  totalTributos?: number;
  importeNeto: number;
  comentarios?: string;
}
