import { CargoCuentaCorriente } from "@/modules/cargos-cuenta-corriente/domain/cargo-cuenta-corriente";
import { TipoCargo } from "@/modules/cargos-cuenta-corriente/domain/tipo-cargo";

/**
 * Interface del repositorio de Cargos de cuenta corriente. Forma parte del DOMINIO.
 */
export interface CargoCuentaCorrienteRepository {
  getById(id: string, empresaId: string): Promise<CargoCuentaCorriente | null>;

  /** Lista los cargos de la empresa activa, opcionalmente filtrados por cliente. */
  list(empresaId: string, clienteId?: string): Promise<CargoCuentaCorriente[]>;

  /**
   * Busca un cargo ya confirmado para un cheque puntual (de un tipo puntual)
   * — se usa para no dejar confirmar el mismo recargo/comisión dos veces.
   */
  getByChequeYTipo(chequeId: string, tipo: TipoCargo, empresaId: string): Promise<CargoCuentaCorriente | null>;

  create(input: CreateCargoCuentaCorrienteInput): Promise<CargoCuentaCorriente>;
}

export interface CreateCargoCuentaCorrienteInput {
  empresaId: string;
  clienteId: string;
  tipo: TipoCargo;
  monto: number;
  chequeId?: string | null;
  motivo?: string | null;
  fecha: Date;
}
