import { httpClient, unwrap } from "@/shared/api/http-client";
import type {
  Chofer,
  EstadoTransporteFiltro,
  TransporteCliente,
  Transportista,
  Vehiculo,
} from "@/modules/transportes/domain/transporte.types";
import type {
  ChoferFormValues,
  TransportistaFormValues,
  VehiculoFormValues,
} from "@/modules/transportes/domain/transporte.schemas";

/**
 * Los formularios dejan los opcionales vacíos como `""`; el backend los espera
 * ausentes — mismo criterio que `clientes.api.ts` y `proveedores.api.ts`.
 */
function cleanPayload<T extends object>(values: T): Partial<T> {
  const cleaned: Partial<T> = {};
  for (const [key, value] of Object.entries(values)) {
    if (value !== "") {
      cleaned[key as keyof T] = value as T[keyof T];
    }
  }
  return cleaned;
}

/** Los tres catálogos (transportistas, choferes, vehículos) tienen la misma forma de API. */
function crearCrudApi<T, V extends object>(path: string) {
  return {
    list(estado?: EstadoTransporteFiltro): Promise<T[]> {
      return unwrap(httpClient.get(path, { params: estado ? { estado } : undefined }));
    },
    create(values: V): Promise<T> {
      return unwrap(httpClient.post(path, cleanPayload(values)));
    },
    /** Reemplaza todos los campos editables (mismas reglas que el alta). */
    update(id: string, values: V): Promise<T> {
      return unwrap(httpClient.patch(`${path}/${id}`, cleanPayload(values)));
    },
    /** Baja lógica: deja de listarse pero no se pierde, se puede reactivar. */
    baja(id: string): Promise<void> {
      return unwrap(httpClient.delete(`${path}/${id}`));
    },
    reactivar(id: string): Promise<T> {
      return unwrap(httpClient.post(`${path}/${id}/reactivar`, {}));
    },
  };
}

export type CrudApi<T, V extends object> = ReturnType<typeof crearCrudApi<T, V>>;

export const transportistasApi = crearCrudApi<Transportista, TransportistaFormValues>("/transportistas");
export const choferesApi = crearCrudApi<Chofer, ChoferFormValues>("/choferes");
export const vehiculosApi = crearCrudApi<Vehiculo, VehiculoFormValues>("/vehiculos");

export const transporteClienteApi = {
  get(clienteId: string): Promise<TransporteCliente> {
    return unwrap(httpClient.get(`/clientes/${clienteId}/transporte`));
  },
  /** Reemplaza de una vez las listas de choferes y vehículos autorizados del cliente. */
  set(clienteId: string, input: { choferIds: string[]; vehiculoIds: string[] }): Promise<TransporteCliente> {
    return unwrap(httpClient.put(`/clientes/${clienteId}/transporte`, input));
  },
};
