import { EstadoTransporteFiltro } from "@/modules/transportes/domain/estado-filtro";
import { TipoVehiculo, Vehiculo } from "@/modules/transportes/domain/vehiculo";

/** Mismas reglas que `TransportistaRepository`. */
export interface VehiculoRepository {
  getById(id: string, empresaId: string): Promise<Vehiculo | null>;
  /** Devuelve solo los que existen y son de esa empresa (activos o no). */
  findByIds(ids: string[], empresaId: string): Promise<Vehiculo[]>;
  /** Busca por patente (ya normalizada) incluyendo inactivos, para detectar duplicados. */
  findByPatente(empresaId: string, patente: string): Promise<Vehiculo | null>;
  list(empresaId: string, estado?: EstadoTransporteFiltro): Promise<Vehiculo[]>;
  create(input: CreateVehiculoInput): Promise<Vehiculo>;
  update(id: string, empresaId: string, input: UpdateVehiculoInput): Promise<Vehiculo>;
  delete(id: string, empresaId: string): Promise<void>;
  reactivar(id: string, empresaId: string): Promise<Vehiculo>;
}

export interface CreateVehiculoInput {
  empresaId: string;
  transportistaId?: string;
  tipo: TipoVehiculo;
  patente: string;
  descripcion?: string;
  rtoVencimiento?: string;
  seguroVencimiento?: string;
  habilitacionAnimalesVencimiento?: string;
}

export type UpdateVehiculoInput = Omit<CreateVehiculoInput, "empresaId">;
