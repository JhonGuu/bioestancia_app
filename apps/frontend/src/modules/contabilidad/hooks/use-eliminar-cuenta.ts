import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { planCuentasApi } from "@/modules/contabilidad/api/plan-cuentas.api";

export function useEliminarCuenta() {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: (id: string) => planCuentasApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["contabilidad", "plan-cuentas", empresaActiva?.empresaId] });
    },
  });
}
