import { httpClient, unwrap } from "@/shared/api/http-client";
import type { PorcentajeCobranzaCliente } from "@/modules/porcentaje-cobranza/domain/porcentaje-cobranza.types";

export const porcentajeCobranzaApi = {
  /** % de cobranza de deuda vencida por cliente, semana a semana (ISO), de un año puntual. */
  getPorcentajeCobranza(anio: number): Promise<PorcentajeCobranzaCliente[]> {
    return unwrap(httpClient.get("/porcentaje-cobranza", { params: { anio } }));
  },
};
