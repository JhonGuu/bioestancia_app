import { CentroCosto } from "@/modules/contabilidad/domain/centro-costo";

export interface CentroCostoRepository {
  list(empresaId: string, incluirInactivos?: boolean): Promise<CentroCosto[]>;
  getById(id: string, empresaId: string): Promise<CentroCosto | null>;
  getByCodigo(codigo: string, empresaId: string): Promise<CentroCosto | null>;
  create(input: CreateCentroCostoInput): Promise<CentroCosto>;
  update(id: string, empresaId: string, input: UpdateCentroCostoInput): Promise<CentroCosto>;
  /** ¿Tiene líneas de asiento imputadas? (para no borrar uno en uso). */
  tieneMovimientos(id: string): Promise<boolean>;
  delete(id: string, empresaId: string): Promise<void>;
}

export interface CreateCentroCostoInput {
  empresaId: string;
  codigo: string;
  nombre: string;
}

export interface UpdateCentroCostoInput {
  codigo?: string;
  nombre?: string;
  activo?: boolean;
}
