import { Chofer } from "@/modules/transportes/domain/chofer";
import { EstadoTransporteFiltro } from "@/modules/transportes/domain/estado-filtro";

/** Mismas reglas que `TransportistaRepository`. */
export interface ChoferRepository {
  getById(id: string, empresaId: string): Promise<Chofer | null>;
  /** Devuelve solo los que existen y son de esa empresa (activos o no). */
  findByIds(ids: string[], empresaId: string): Promise<Chofer[]>;
  /** Busca por CUIT (ya normalizado) incluyendo inactivos, para detectar duplicados. */
  findByCuit(empresaId: string, cuit: string): Promise<Chofer | null>;
  list(empresaId: string, estado?: EstadoTransporteFiltro): Promise<Chofer[]>;
  create(input: CreateChoferInput): Promise<Chofer>;
  update(id: string, empresaId: string, input: UpdateChoferInput): Promise<Chofer>;
  delete(id: string, empresaId: string): Promise<void>;
  reactivar(id: string, empresaId: string): Promise<Chofer>;
}

export interface CreateChoferInput {
  empresaId: string;
  transportistaId?: string;
  nombre: string;
  apellido: string;
  cuit: string;
  dni?: string;
  telefono?: string;
  licenciaVencimiento?: string;
}

export type UpdateChoferInput = Omit<CreateChoferInput, "empresaId">;
