import { useMutation } from "@tanstack/react-query";

import { importacionComprasApi } from "@/modules/compras/api/importacion-compras.api";

export function usePrevisualizarImportacionCompras() {
  return useMutation({
    mutationFn: (archivo: File) => importacionComprasApi.previsualizar(archivo),
  });
}
