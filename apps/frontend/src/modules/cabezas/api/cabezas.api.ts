import { httpClient, unwrap } from "@/shared/api/http-client";
import type { FiltrosInformeCabezas, InformeCabezas } from "@/modules/cabezas/domain/cabezas.types";

export const cabezasApi = {
  get(filtros: FiltrosInformeCabezas): Promise<InformeCabezas> {
    return unwrap(httpClient.get("/cabezas", { params: filtros }));
  },
};
