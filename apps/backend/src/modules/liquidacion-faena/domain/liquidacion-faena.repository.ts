import { LiquidacionFaena } from "@/modules/liquidacion-faena/domain/liquidacion-faena";

export interface LiquidacionFaenaRepository {
  getById(id: string, empresaId: string): Promise<LiquidacionFaena | null>;

  /** Una compra tiene a lo sumo una liquidación de faena (relación 1 a 1). */
  getByCompraId(compraId: string, empresaId: string): Promise<LiquidacionFaena | null>;

  /** Todas las liquidaciones de faena de la empresa — la usa `informes-compras` para no hacer N+1 por tropa. */
  list(empresaId: string): Promise<LiquidacionFaena[]>;

  create(input: CreateLiquidacionFaenaInput): Promise<LiquidacionFaena>;
}

export interface CreateLiquidacionFaenaInput {
  empresaId: string;
  compraId: string;
  frigorificoId?: string;
  fecha: Date;
  comentarios?: string;
  /** Siempre llega calculado (suma de los subtotales por categoría), nunca del cliente HTTP. */
  total: number;
}
