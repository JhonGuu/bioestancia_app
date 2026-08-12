import { httpClient, unwrap } from "@/shared/api/http-client";
import type { CargoCuentaCorriente } from "@/modules/cargos-cuenta-corriente/domain/cargo-cuenta-corriente.types";

export const cargosCuentaCorrienteApi = {
  list(clienteId?: string): Promise<CargoCuentaCorriente[]> {
    return unwrap(httpClient.get("/cargos-cuenta-corriente", { params: clienteId ? { clienteId } : undefined }));
  },
};
