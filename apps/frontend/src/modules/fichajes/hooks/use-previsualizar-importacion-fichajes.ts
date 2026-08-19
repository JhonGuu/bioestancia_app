import { useMutation } from "@tanstack/react-query";

import { fichajesApi } from "@/modules/fichajes/api/fichajes.api";

export function usePrevisualizarImportacionFichajes() {
  return useMutation({
    mutationFn: (archivo: File) => fichajesApi.previsualizarImportacion(archivo),
  });
}
