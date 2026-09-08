import { useMutation } from "@tanstack/react-query";

import { importacionesApi } from "@/modules/contabilidad/api/importaciones.api";

export function usePrevisualizarImportacionAsientos() {
  return useMutation({
    mutationFn: (archivo: File) => importacionesApi.previsualizarAsientos(archivo),
  });
}
