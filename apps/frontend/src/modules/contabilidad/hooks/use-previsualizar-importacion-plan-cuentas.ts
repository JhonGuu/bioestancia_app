import { useMutation } from "@tanstack/react-query";

import { importacionesApi } from "@/modules/contabilidad/api/importaciones.api";

export function usePrevisualizarImportacionPlanCuentas() {
  return useMutation({
    mutationFn: (archivo: File) => importacionesApi.previsualizarPlanCuentas(archivo),
  });
}
