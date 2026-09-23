import { httpClient, unwrap } from "@/shared/api/http-client";
import { filenameFromContentDisposition } from "@/shared/lib/download-blob";
import type {
  PlanificacionCabezasFila,
  UpsertPlanificacionCabezasInput,
} from "@/modules/planificacion-cabezas/domain/planificacion-cabezas.types";

export interface ListPlanificacionCabezasParams {
  desde: string;
  hasta: string;
  clienteId?: string;
}

export interface ArchivoDescargado {
  blob: Blob;
  filename: string;
}

export const planificacionCabezasApi = {
  list(params: ListPlanificacionCabezasParams): Promise<PlanificacionCabezasFila[]> {
    return unwrap(httpClient.get("/planificacion-cabezas", { params }));
  },

  /** PDF del reparto de UN día ("YYYY-MM-DD"), en formato angosto para mandar por WhatsApp. */
  async descargarRepartoPdf(fecha: string): Promise<ArchivoDescargado> {
    const response = await httpClient.get("/planificacion-cabezas/reparto/pdf", {
      params: { fecha },
      responseType: "blob",
    });
    return {
      blob: response.data,
      filename: filenameFromContentDisposition(response.headers, `reparto-${fecha}.pdf`),
    };
  },

  /** Crea/actualiza el plan de un cliente para uno o más días (upsert por clienteId+fecha). */
  upsert(input: UpsertPlanificacionCabezasInput): Promise<unknown> {
    return unwrap(httpClient.post("/planificacion-cabezas", input));
  },
};
