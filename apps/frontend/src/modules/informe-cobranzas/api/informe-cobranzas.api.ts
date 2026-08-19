import { httpClient, unwrap } from "@/shared/api/http-client";
import { filenameFromContentDisposition } from "@/shared/lib/download-blob";
import type {
  FiltrosInformeCobranzas,
  InformeCobranzas,
} from "@/modules/informe-cobranzas/domain/informe-cobranzas.types";

export interface ArchivoDescargado {
  blob: Blob;
  filename: string;
}

export const informeCobranzasApi = {
  get(filtros: FiltrosInformeCobranzas): Promise<InformeCobranzas> {
    return unwrap(httpClient.get("/informe-cobranzas", { params: filtros }));
  },

  async descargarPdf(filtros: FiltrosInformeCobranzas): Promise<ArchivoDescargado> {
    const response = await httpClient.get("/informe-cobranzas/pdf", { params: filtros, responseType: "blob" });
    return {
      blob: response.data,
      filename: filenameFromContentDisposition(response.headers, "informe-cobranzas.pdf"),
    };
  },

  async descargarExcel(filtros: FiltrosInformeCobranzas): Promise<ArchivoDescargado> {
    const response = await httpClient.get("/informe-cobranzas/excel", { params: filtros, responseType: "blob" });
    return {
      blob: response.data,
      filename: filenameFromContentDisposition(response.headers, "informe-cobranzas.xlsx"),
    };
  },
};
