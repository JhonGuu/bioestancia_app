import { useMutation } from "@tanstack/react-query";

import { boletasApi } from "@/modules/boletas/api/boletas.api";
import { downloadBlob } from "@/shared/lib/download-blob";

/** Descarga el PDF con todas las boletas de la empresa en un día, agrupadas por cliente. */
export function useDescargarReporteDiarioPdf() {
  return useMutation({
    mutationFn: (fecha: string) => boletasApi.descargarReporteDiarioPdf(fecha),
    onSuccess: ({ blob, filename }) => downloadBlob(blob, filename),
  });
}

/** Igual que `useDescargarReporteDiarioPdf`, pero exportando a Excel (.xlsx). */
export function useDescargarReporteDiarioExcel() {
  return useMutation({
    mutationFn: (fecha: string) => boletasApi.descargarReporteDiarioExcel(fecha),
    onSuccess: ({ blob, filename }) => downloadBlob(blob, filename),
  });
}
