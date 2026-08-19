import { Frigorifico } from "@/modules/frigorificos/domain/frigorifico";

/**
 * "activos" (default): solo `isNull(deletedAt)` — lo que se usa en
 * selectores (resultado de faena, etc). "inactivos": solo los soft-deleted —
 * para poder encontrarlos y reactivarlos. "todos": sin filtrar.
 */
export type EstadoFrigorificoFiltro = "activos" | "inactivos" | "todos";

/**
 * Interface del repositorio de Frigoríficos. Forma parte del DOMINIO.
 *
 * `empresaId` obligatorio en todos los métodos — mismo criterio que
 * `ProveedorRepository`.
 *
 * `getById`/`update`/`delete`/`reactivar` NO filtran por `isNull(deletedAt)`
 * (a diferencia de `list`): un frigorífico inactivo tiene que poder seguir
 * editándose/encontrándose por id — resultados de faena históricos siguen
 * apuntando a una fila válida.
 */
export interface FrigorificoRepository {
  getById(id: string, empresaId: string): Promise<Frigorifico | null>;

  /** Lista los frigoríficos de una empresa puntual. `estado` filtra por activos/inactivos/todos (default "activos"). */
  list(empresaId: string, estado?: EstadoFrigorificoFiltro): Promise<Frigorifico[]>;

  create(input: CreateFrigorificoInput): Promise<Frigorifico>;

  /** Reemplaza todos los campos editables, sin importar si está activo. Tira NOT_FOUND si no existe (o no es de esta empresa). */
  update(id: string, empresaId: string, input: UpdateFrigorificoInput): Promise<Frigorifico>;

  /**
   * Soft-delete: marca `deletedAt` + `activo=false`, no borra la fila —
   * los resultados de faena ya cargados siguen apuntando a una fila válida.
   * Tira NOT_FOUND si no existe (o no es de esta empresa).
   */
  delete(id: string, empresaId: string): Promise<void>;

  /** Deshace el soft-delete: limpia `deletedAt` y vuelve a poner `activo=true`. Tira NOT_FOUND si no existe (o no es de esta empresa). */
  reactivar(id: string, empresaId: string): Promise<Frigorifico>;
}

export interface CreateFrigorificoInput {
  empresaId: string;
  nombre: string;
  cuit?: string;
  senasaNumero?: string;
  rucaNumero?: string;
}

/** Reemplazo completo (no parcial) de los campos editables — ver `update()` arriba. */
export type UpdateFrigorificoInput = Omit<CreateFrigorificoInput, "empresaId">;
