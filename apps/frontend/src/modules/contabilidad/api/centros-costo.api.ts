import { httpClient, unwrap } from "@/shared/api/http-client";
import type { CentroCosto } from "@/modules/contabilidad/domain/centro-costo.types";
import type { CentroCostoFormValues } from "@/modules/contabilidad/domain/centro-costo.schemas";

export const centrosCostoApi = {
  list(): Promise<CentroCosto[]> {
    return unwrap(httpClient.get("/contabilidad/centros-costo"));
  },

  create(input: CentroCostoFormValues): Promise<CentroCosto> {
    return unwrap(httpClient.post("/contabilidad/centros-costo", input));
  },

  update(id: string, input: Partial<CentroCostoFormValues> & { activo?: boolean }): Promise<CentroCosto> {
    return unwrap(httpClient.patch(`/contabilidad/centros-costo/${id}`, input));
  },

  remove(id: string): Promise<{ eliminado: boolean; mensaje: string }> {
    return unwrap(httpClient.delete(`/contabilidad/centros-costo/${id}`));
  },
};
