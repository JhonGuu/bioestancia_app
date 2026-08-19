import { ResultadoFaena } from "@/modules/resultado-faena/domain/resultado-faena";

export interface ResultadoFaenaRepository {
  getById(id: string, empresaId: string): Promise<ResultadoFaena | null>;

  /** Una compra tiene a lo sumo un resultado de faena (relación 1 a 1). */
  getByCompraId(compraId: string, empresaId: string): Promise<ResultadoFaena | null>;

  create(input: CreateResultadoFaenaInput): Promise<ResultadoFaena>;
}

export interface CreateResultadoFaenaInput {
  empresaId: string;
  compraId: string;
  frigorificoId?: string;
  fechaFaena: Date;
  numero?: string;
  numeroAutorizacion?: string;
  kgVivoTotal: number;
  kgCarneTotal: number;
  comisosKg: number;
  comisosCabezas: number;
  /** Siempre llega calculado (kgCarneTotal / kgVivoTotal * 100), nunca del cliente HTTP. */
  rendimiento: number;
  comentarios?: string;
}
