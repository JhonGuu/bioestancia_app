import { httpClient, unwrap } from "@/shared/api/http-client";
import type { CreateProveedorFormValues } from "@/modules/proveedores/domain/proveedor.schemas";
import type { Proveedor } from "@/modules/proveedores/domain/proveedor.types";

/**
 * El form deja campos opcionales vacíos como `""` (para que los inputs sean
 * controlados). El backend los espera ausentes (`undefined`), no `""` —
 * mismo criterio que `clientes.api.ts`.
 */
function cleanPayload<T extends Record<string, unknown>>(values: T): Partial<T> {
  const cleaned: Partial<T> = {};
  for (const [key, value] of Object.entries(values)) {
    if (value !== "") {
      cleaned[key as keyof T] = value as T[keyof T];
    }
  }
  return cleaned;
}

export type EstadoProveedorFiltro = "activos" | "inactivos" | "todos";

export const proveedoresApi = {
  /** `estado` filtra activos/inactivos/todos — default "activos" (mismo default que el backend). */
  list(estado?: EstadoProveedorFiltro): Promise<Proveedor[]> {
    return unwrap(httpClient.get("/proveedores", { params: estado ? { estado } : undefined }));
  },

  getById(id: string): Promise<Proveedor> {
    return unwrap(httpClient.get(`/proveedores/${id}`));
  },

  create(input: CreateProveedorFormValues): Promise<Proveedor> {
    return unwrap(httpClient.post("/proveedores", cleanPayload(input)));
  },

  /** Reemplaza todos los campos editables (mismas reglas que el alta). */
  update(id: string, input: CreateProveedorFormValues): Promise<Proveedor> {
    return unwrap(httpClient.patch(`/proveedores/${id}`, cleanPayload(input)));
  },

  /** Soft-delete — el proveedor deja de listarse, pero sus compras históricas no se tocan. */
  remove(id: string): Promise<void> {
    return unwrap(httpClient.delete(`/proveedores/${id}`));
  },

  /** Deshace el soft-delete: vuelve a poner al proveedor como activo. */
  reactivar(id: string): Promise<Proveedor> {
    return unwrap(httpClient.post(`/proveedores/${id}/reactivar`, {}));
  },
};
