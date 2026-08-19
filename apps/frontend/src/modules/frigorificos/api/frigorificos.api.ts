import { httpClient, unwrap } from "@/shared/api/http-client";
import type { CreateFrigorificoFormValues } from "@/modules/frigorificos/domain/frigorifico.schemas";
import type { Frigorifico } from "@/modules/frigorificos/domain/frigorifico.types";

/**
 * El form deja campos opcionales vacíos como `""` (para que los inputs sean
 * controlados). El backend los espera ausentes (`undefined`), no `""` —
 * mismo criterio que `proveedores.api.ts`.
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

export type EstadoFrigorificoFiltro = "activos" | "inactivos" | "todos";

export const frigorificosApi = {
  /** `estado` filtra activos/inactivos/todos — default "activos" (mismo default que el backend). */
  list(estado?: EstadoFrigorificoFiltro): Promise<Frigorifico[]> {
    return unwrap(httpClient.get("/frigorificos", { params: estado ? { estado } : undefined }));
  },

  getById(id: string): Promise<Frigorifico> {
    return unwrap(httpClient.get(`/frigorificos/${id}`));
  },

  create(input: CreateFrigorificoFormValues): Promise<Frigorifico> {
    return unwrap(httpClient.post("/frigorificos", cleanPayload(input)));
  },

  /** Reemplaza todos los campos editables (mismas reglas que el alta). */
  update(id: string, input: CreateFrigorificoFormValues): Promise<Frigorifico> {
    return unwrap(httpClient.patch(`/frigorificos/${id}`, cleanPayload(input)));
  },

  /** Soft-delete — el frigorífico deja de listarse, pero sus resultados de faena históricos no se tocan. */
  remove(id: string): Promise<void> {
    return unwrap(httpClient.delete(`/frigorificos/${id}`));
  },

  /** Deshace el soft-delete: vuelve a poner al frigorífico como activo. */
  reactivar(id: string): Promise<Frigorifico> {
    return unwrap(httpClient.post(`/frigorificos/${id}/reactivar`, {}));
  },
};
