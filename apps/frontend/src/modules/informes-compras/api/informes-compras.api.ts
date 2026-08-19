import { httpClient, unwrap } from "@/shared/api/http-client";
import type { RentabilidadTropa } from "@/modules/informes-compras/domain/rentabilidad-tropa.types";

export const informesComprasApi = {
  /** Rentabilidad de cada tropa de la empresa activa (admin/contable). */
  rentabilidadTropas(): Promise<RentabilidadTropa[]> {
    return unwrap(httpClient.get("/compras/informes/rentabilidad"));
  },
};
