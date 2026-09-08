import { useMutation } from "@tanstack/react-query";

import { importacionesApi } from "@/modules/contabilidad/api/importaciones.api";
import { downloadBlob } from "@/shared/lib/download-blob";
import type { TipoPlantillaImportacion } from "@/modules/contabilidad/domain/importacion.types";

/** Descarga la plantilla Excel de uno de los tres importadores y dispara la descarga en el browser. */
export function useDescargarPlantillaImportacion() {
  return useMutation({
    mutationFn: async (tipo: TipoPlantillaImportacion) => {
      const { blob, filename } = await importacionesApi.descargarPlantilla(tipo);
      downloadBlob(blob, filename);
    },
  });
}
