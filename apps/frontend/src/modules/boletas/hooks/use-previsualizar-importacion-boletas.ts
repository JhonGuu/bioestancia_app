import { useMutation } from "@tanstack/react-query";

import { importacionBoletasApi } from "@/modules/boletas/api/importacion-boletas.api";

export function usePrevisualizarImportacionBoletas() {
  return useMutation({
    mutationFn: (archivo: File) => importacionBoletasApi.previsualizar(archivo),
  });
}
