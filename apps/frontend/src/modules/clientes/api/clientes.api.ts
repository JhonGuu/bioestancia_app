import { httpClient, unwrap } from "@/shared/api/http-client";
import type { CreateClienteFormValues } from "@/modules/clientes/domain/cliente.schemas";
import type { Cliente } from "@/modules/clientes/domain/cliente.types";

/**
 * El form deja campos opcionales vacíos como `""` (para que los inputs sean
 * controlados). El backend los espera ausentes (`undefined`), no `""` — por
 * ejemplo `email: z.string().email().optional()` rechaza un string vacío.
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

export const clientesApi = {
  list(): Promise<Cliente[]> {
    return unwrap(httpClient.get("/clientes"));
  },

  getById(id: string): Promise<Cliente> {
    return unwrap(httpClient.get(`/clientes/${id}`));
  },

  create(input: CreateClienteFormValues): Promise<Cliente> {
    return unwrap(httpClient.post("/clientes", cleanPayload(input)));
  },
};
