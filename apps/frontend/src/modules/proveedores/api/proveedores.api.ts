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

export const proveedoresApi = {
  list(): Promise<Proveedor[]> {
    return unwrap(httpClient.get("/proveedores"));
  },

  getById(id: string): Promise<Proveedor> {
    return unwrap(httpClient.get(`/proveedores/${id}`));
  },

  create(input: CreateProveedorFormValues): Promise<Proveedor> {
    return unwrap(httpClient.post("/proveedores", cleanPayload(input)));
  },
};
