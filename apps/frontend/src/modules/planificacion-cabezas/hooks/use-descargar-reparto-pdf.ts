import { useMutation } from "@tanstack/react-query";

import { planificacionCabezasApi } from "@/modules/planificacion-cabezas/api/planificacion-cabezas.api";
import { downloadBlob } from "@/shared/lib/download-blob";

/** Descarga el PDF del reparto de un día ("YYYY-MM-DD") para mandarlo por WhatsApp. */
export function useDescargarRepartoPdf() {
  return useMutation({
    mutationFn: (fecha: string) => planificacionCabezasApi.descargarRepartoPdf(fecha),
    onSuccess: ({ blob, filename }) => downloadBlob(blob, filename),
  });
}
