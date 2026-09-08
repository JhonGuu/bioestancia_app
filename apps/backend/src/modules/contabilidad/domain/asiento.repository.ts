import { Asiento, EstadoAsiento, RespaldoAsiento, TipoAsiento } from "@/modules/contabilidad/domain/asiento";
import { TipoAuxiliar } from "@/modules/contabilidad/domain/tipo-auxiliar";

/** Interface del repositorio de asientos. Forma parte del DOMINIO. */
export interface AsientoRepository {
  list(filtros: ListarAsientosFiltros): Promise<Asiento[]>;
  getById(id: string, empresaId: string): Promise<Asiento | null>;
  /** Asiento generado a partir de un documento puntual (fase 2). */
  getByOrigen(empresaId: string, origenTipo: string, origenId: string): Promise<Asiento | null>;
  /** ¿Ya existe un asiento de este tipo en el ejercicio? (apertura/cierre son únicos). */
  existePorTipo(ejercicioId: string, tipo: TipoAsiento): Promise<boolean>;
  /** Crea cabecera + líneas en una sola transacción. */
  create(input: CreateAsientoInput): Promise<Asiento>;
  /** Actualiza la cabecera y REEMPLAZA las líneas, en una sola transacción. */
  update(id: string, empresaId: string, input: UpdateAsientoInput): Promise<Asiento>;
  cambiarEstado(id: string, empresaId: string, estado: EstadoAsiento, numero?: number): Promise<Asiento>;
  delete(id: string, empresaId: string): Promise<void>;
  /** Próximo número correlativo del ejercicio (máximo asignado + 1). */
  siguienteNumero(ejercicioId: string): Promise<number>;
}

export interface ListarAsientosFiltros {
  empresaId: string;
  ejercicioId?: string;
  periodoId?: string;
  desde?: Date;
  hasta?: Date;
  tipo?: TipoAsiento;
  estado?: EstadoAsiento;
  respaldo?: RespaldoAsiento;
  cuentaId?: string;
}

export interface LineaAsientoInput {
  cuentaId: string;
  debe: number;
  haber: number;
  detalle?: string | null;
  auxiliarTipo?: TipoAuxiliar | null;
  auxiliarId?: string | null;
  fechaOrigen?: Date | null;
  centroCostoId?: string | null;
}

export interface CreateAsientoInput {
  empresaId: string;
  ejercicioId: string;
  periodoId: string;
  fecha: Date;
  tipo: TipoAsiento;
  estado: EstadoAsiento;
  respaldo: RespaldoAsiento;
  descripcion: string;
  numero?: number | null;
  origenTipo?: string | null;
  origenId?: string | null;
  lineas: LineaAsientoInput[];
}

export interface UpdateAsientoInput {
  fecha?: Date;
  periodoId?: string;
  respaldo?: RespaldoAsiento;
  descripcion?: string;
  lineas?: LineaAsientoInput[];
}
