import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { importacionesApi } from "@/modules/contabilidad/api/importaciones.api";
import type { CuentaAImportar } from "@/modules/contabilidad/domain/importacion.types";

export function useConfirmarImportacionPlanCuentas() {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: (filas: CuentaAImportar[]) => importacionesApi.confirmarPlanCuentas(filas),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["contabilidad", "plan-cuentas", empresaActiva?.empresaId] });
    },
  });
}
