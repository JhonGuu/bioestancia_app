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

  /** Reemplaza todos los campos editables (mismas reglas que el alta). */
  update(id: string, input: CreateClienteFormValues): Promise<Cliente> {
    return unwrap(httpClient.patch(`/clientes/${id}`, cleanPayload(input)));
  },

  /** Soft-delete — el cliente deja de listarse, pero sus ventas/boletas históricas no se tocan. */
  remove(id: string): Promise<void> {
    return unwrap(httpClient.delete(`/clientes/${id}`));
  },
};
