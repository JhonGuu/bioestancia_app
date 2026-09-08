import { useMutation } from "@tanstack/react-query";

import { importacionesApi } from "@/modules/contabilidad/api/importaciones.api";

export function usePrevisualizarImportacionSaldos() {
  return useMutation({
    mutationFn: (archivo: File) => importacionesApi.previsualizarSaldosIniciales(archivo),
  });
}
