import { Cliente } from "@/modules/clientes/domain/cliente";
import { CondicionFiscal } from "@/modules/clientes/domain/condicion-fiscal";

/**
 * Interface del repositorio de Clientes. Forma parte del DOMINIO.
 *
 * `empresaId` es obligatorio en `getById` y `list` (no opcional): un cliente
 * siempre pertenece a una empresa, y nunca se lee sin saber de cuál — es lo
 * que evita que Bioestancia vea clientes de El Meridiano o viceversa.
 *
 * La implementación concreta (infra/repository/cliente.repository.ts, todavía
 * sin escribir) tiene que filtrar `isNull(deletedAt)` en `getById` y `list`
 * — mismo patrón que `EmpresaRepositoryDrizzle` — para que un cliente
 * soft-deleted no vuelva a aparecer.
 */
export interface ClienteRepository {
  getById(id: string, empresaId: string): Promise<Cliente | null>;

  /** Lista los clientes de una empresa puntual. */
  list(empresaId: string): Promise<Cliente[]>;

  create(input: CreateClienteInput): Promise<Cliente>;

  /** Reemplaza todos los campos editables. Tira NOT_FOUND si no existe (o no es de esta empresa). */
  update(id: string, empresaId: string, input: UpdateClienteInput): Promise<Cliente>;

  /**
   * Soft-delete: marca `deletedAt` + `activo=false`, no borra la fila. Nunca
   * emite un DELETE real — así no hay riesgo de romper el `onDelete:
   * "restrict"` de `ventas.clienteId` si el cliente ya tiene ventas
   * cargadas; esas filas siguen apuntando a un cliente que simplemente deja
   * de listarse. Tira NOT_FOUND si no existe (o no es de esta empresa).
   */
  delete(id: string, empresaId: string): Promise<void>;
}

export interface CreateClienteInput {
  empresaId: string;
  listaDePreciosId?: string | null;
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
  esRevendedor?: boolean;
}

/** Reemplazo completo (no parcial) de los campos editables — ver `update()` arriba. */
export type UpdateClienteInput = Omit<CreateClienteInput, "empresaId">;
