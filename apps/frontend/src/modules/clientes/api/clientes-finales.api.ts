import { httpClient, unwrap } from "@/shared/api/http-client";
import type { ClienteFinal } from "@/modules/clientes/domain/cliente-final.types";

export const clientesFinalesApi = {
  list(clienteId: string): Promise<ClienteFinal[]> {
    return unwrap(httpClient.get(`/clientes/${clienteId}/clientes-finales`));
  },

  create(clienteId: string, nombre: string): Promise<ClienteFinal> {
    return unwrap(httpClient.post(`/clientes/${clienteId}/clientes-finales`, { nombre }));
  },
};
