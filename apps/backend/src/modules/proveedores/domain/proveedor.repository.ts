import { Proveedor } from "@/modules/proveedores/domain/proveedor";
import { CondicionFiscal } from "@/modules/clientes/domain/condicion-fiscal";
import { CodigoAfipPorcino } from "@/modules/proveedores/domain/codigo-afip-porcino";

/**
 * "activos" (default): solo `isNull(deletedAt)` — lo que se usa en
 * selectores (compras, boletas, etc). "inactivos": solo los soft-deleted —
 * para poder encontrarlos y reactivarlos. "todos": sin filtrar.
 */
export type EstadoProveedorFiltro = "activos" | "inactivos" | "todos";

/**
 * Interface del repositorio de Proveedores. Forma parte del DOMINIO.
 *
 * `empresaId` obligatorio en todos los métodos — nunca se lee/escribe sin
 * saber de qué empresa es (mismo motivo que `ClienteRepository`).
 *
 * `getById`/`update`/`delete`/`reactivar` NO filtran por `isNull(deletedAt)`
 * (a diferencia de `list`, que sí lo hace por defecto): un proveedor
 * inactivo tiene que poder seguir editándose/encontrándose por id — el
 * soft-delete solo lo saca de listados/selectores, no lo vuelve invisible.
 */
export interface ProveedorRepository {
  getById(id: string, empresaId: string): Promise<Proveedor | null>;

  /** Lista los proveedores de una empresa puntual. `estado` filtra por activos/inactivos/todos (default "activos"). */
  list(empresaId: string, estado?: EstadoProveedorFiltro): Promise<Proveedor[]>;

  create(input: CreateProveedorInput): Promise<Proveedor>;

  /** Reemplaza todos los campos editables, sin importar si está activo. Tira NOT_FOUND si no existe (o no es de esta empresa). */
  update(id: string, empresaId: string, input: UpdateProveedorInput): Promise<Proveedor>;

  /**
   * Soft-delete: marca `deletedAt` + `activo=false`, no borra la fila —
   * mismo motivo que `ClienteRepository.delete`: las compras ya cargadas a
   * este proveedor siguen apuntando a una fila válida. Tira NOT_FOUND si no
   * existe (o no es de esta empresa).
   */
  delete(id: string, empresaId: string): Promise<void>;

  /**
   * Deshace el soft-delete: limpia `deletedAt` y vuelve a poner `activo=true`.
   * Tira NOT_FOUND si no existe (o no es de esta empresa).
   */
  reactivar(id: string, empresaId: string): Promise<Proveedor>;
}

export interface CreateProveedorInput {
  empresaId: string;
  nombre?: string;
  apellido?: string;
  razonSocial?: string;
  cuit?: string;
  dni?: string;
  domicilio?: string;
  email?: string;
  pais?: string;
  provincia?: string;
  ubicacion?: string;
  condicionFiscal: CondicionFiscal;
  datosBancarios?: string;
  porcentajeDesbaste?: number;
  renspa?: string;
  codigoAfip?: CodigoAfipPorcino;
}

/** Reemplazo completo (no parcial) de los campos editables — ver `update()` arriba. */
export type UpdateProveedorInput = Omit<CreateProveedorInput, "empresaId">;
