import { Cargo } from "@/modules/personal/domain/cargo";

export type EstadoCargoFiltro = "activos" | "inactivos" | "todos";

/**
 * Interface del repositorio de Cargos. Forma parte del DOMINIO.
 * Mismo criterio que `FrigorificoRepository`: `getById`/`update`/`delete`/`reactivar`
 * no filtran por activo (un cargo inactivo tiene que seguir siendo editable/encontrable
 * — empleados históricos siguen apuntando a una fila válida).
 */
export interface CargoRepository {
  getById(id: string, empresaId: string): Promise<Cargo | null>;

  list(empresaId: string, estado?: EstadoCargoFiltro): Promise<Cargo[]>;

  create(input: CreateCargoInput): Promise<Cargo>;

  update(id: string, empresaId: string, input: UpdateCargoInput): Promise<Cargo>;

  delete(id: string, empresaId: string): Promise<void>;

  reactivar(id: string, empresaId: string): Promise<Cargo>;
}

export interface CreateCargoInput {
  empresaId: string;
  nombre: string;
  toleranciaMinutos?: number | null;
}

export type UpdateCargoInput = Omit<CreateCargoInput, "empresaId">;
