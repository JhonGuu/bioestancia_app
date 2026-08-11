import { useMutation } from "@tanstack/react-query";

import { boletasApi } from "@/modules/boletas/api/boletas.api";
import { downloadBlob } from "@/shared/lib/download-blob";

/** Descarga el PDF de una boleta puntual (diseño tipo papel físico). */
export function useDescargarBoletaPdf() {
  return useMutation({
    mutationFn: (id: string) => boletasApi.descargarPdf(id),
    onSuccess: ({ blob, filename }) => downloadBlob(blob, filename),
  });
}
