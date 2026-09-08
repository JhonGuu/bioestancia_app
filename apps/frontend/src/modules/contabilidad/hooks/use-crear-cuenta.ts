import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { planCuentasApi } from "@/modules/contabilidad/api/plan-cuentas.api";

export function useCrearCuenta() {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: planCuentasApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["contabilidad", "plan-cuentas", empresaActiva?.empresaId] });
    },
  });
}
