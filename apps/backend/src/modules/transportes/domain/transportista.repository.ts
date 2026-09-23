import { Transportista } from "@/modules/transportes/domain/transportista";
import { EstadoTransporteFiltro } from "@/modules/transportes/domain/estado-filtro";

/**
 * `empresaId` obligatorio en todos los métodos (los datos de transporte son
 * por empresa, nunca compartidos). Igual que `ProveedorRepository`:
 * `getById`/`update`/`delete`/`reactivar` NO filtran por baja lógica — un
 * transportista inactivo se puede seguir encontrando y editando.
 */
export interface TransportistaRepository {
  getById(id: string, empresaId: string): Promise<Transportista | null>;
  /** Busca por CUIT (ya normalizado) incluyendo inactivos, para detectar duplicados. */
  findByCuit(empresaId: string, cuit: string): Promise<Transportista | null>;
  list(empresaId: string, estado?: EstadoTransporteFiltro): Promise<Transportista[]>;
  create(input: CreateTransportistaInput): Promise<Transportista>;
  /** Reemplaza todos los campos editables. Tira NOT_FOUND si no existe o no es de esta empresa. */
  update(id: string, empresaId: string, input: UpdateTransportistaInput): Promise<Transportista>;
  /** Soft-delete. Tira NOT_FOUND si no existe (o ya estaba dado de baja). */
  delete(id: string, empresaId: string): Promise<void>;
  reactivar(id: string, empresaId: string): Promise<Transportista>;
}

export interface CreateTransportistaInput {
  empresaId: string;
  nombre: string;
  cuit: string;
  telefono?: string;
  esPropio?: boolean;
}

export type UpdateTransportistaInput = Omit<CreateTransportistaInput, "empresaId">;
