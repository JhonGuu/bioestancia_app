import { LiquidacionCompra } from "@/modules/liquidacion-compra/domain/liquidacion-compra";

export interface LiquidacionCompraRepository {
  getById(id: string, empresaId: string): Promise<LiquidacionCompra | null>;

  /** Una compra tiene a lo sumo una liquidación (relación 1 a 1). */
  getByCompraId(compraId: string, empresaId: string): Promise<LiquidacionCompra | null>;

  /** Todas las liquidaciones de la empresa — la usa `informes-compras` para no hacer N+1 por tropa. */
  list(empresaId: string): Promise<LiquidacionCompra[]>;

  create(input: CreateLiquidacionCompraInput): Promise<LiquidacionCompra>;

  /**
   * Completa `numeroComprobante`/`cae`/`fechaVencimientoCae` una vez que
   * AFIP autorizó la liquidación (ver `EmitirCaeLiquidacionCompra`). Antes
   * de esto esos campos se cargaban a mano en `create`.
   */
  updateCae(id: string, empresaId: string, input: UpdateCaeInput): Promise<LiquidacionCompra>;
}

export interface UpdateCaeInput {
  numeroComprobante: string;
  cae: string;
  fechaVencimientoCae: Date;
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
