import { useMutation } from "@tanstack/react-query";

import { importacionCobrosApi } from "@/modules/cobros/api/importacion-cobros.api";

export function usePrevisualizarImportacionCobros() {
  return useMutation({
    mutationFn: (archivo: File) => importacionCobrosApi.previsualizar(archivo),
  });
}
