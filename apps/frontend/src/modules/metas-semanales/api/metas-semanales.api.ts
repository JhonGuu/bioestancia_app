import { httpClient, unwrap } from "@/shared/api/http-client";
import type { ProgresoMetaSemanal } from "@/modules/metas-semanales/domain/progreso-meta-semanal.types";

export const metasSemanalesApi = {
  /** Progreso de la semana actual (o de la semana que contiene `fecha`, si se pasa) de los clientes con meta configurada. */
  getProgreso(fecha?: string): Promise<ProgresoMetaSemanal[]> {
    return unwrap(httpClient.get("/metas-semanales/progreso", { params: fecha ? { fecha } : undefined }));
  },
};
