import { Cheque } from "@/modules/cheques/domain/cheque";
import { EstadoCheque } from "@/modules/cheques/domain/estado-cheque";

/**
 * Interface del repositorio de Cheques. Forma parte del DOMINIO.
 *
 * `empresaId` obligatorio en todos los métodos — mismo motivo que el resto
 * de los repositorios: nunca se lee/escribe sin saber de qué empresa es.
 */
export interface ChequeRepository {
  getById(id: string, empresaId: string): Promise<Cheque | null>;

  /** Lista los cheques de la empresa activa — "cartera de cheques", filtra opcionalmente por estado y/o cliente. */
  list(empresaId: string, filtro?: ListChequesFiltro): Promise<Cheque[]>;

  create(input: CreateChequeInput): Promise<Cheque>;

  /** Cambia `estado` (+ `fechaUltimoCambioEstado`, + `motivoRechazo` si aplica). Tira NOT_FOUND si no existe (o no es de esta empresa). */
  actualizarEstado(id: string, empresaId: string, input: ActualizarEstadoChequeInput): Promise<Cheque>;
}

export interface ListChequesFiltro {
  estado?: EstadoCheque;
  clienteId?: string;
}

export interface CreateChequeInput {
  empresaId: string;
  clienteId: string;
  numero: string;
  banco: string;
  cuitLibrador?: string | null;
  titular?: string | null;
  fechaEmision: Date;
  fechaPago: Date;
  monto: number;
}

export interface ActualizarEstadoChequeInput {
  estado: EstadoCheque;
  motivoRechazo?: string | null;
  endosadoA?: string | null;
  fechaEndoso?: Date | null;
}
