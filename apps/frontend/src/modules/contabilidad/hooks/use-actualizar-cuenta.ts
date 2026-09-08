import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { planCuentasApi } from "@/modules/contabilidad/api/plan-cuentas.api";
import type { CuentaPayload } from "@/modules/contabilidad/domain/cuenta.schemas";

export function useActualizarCuenta() {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CuentaPayload> & { activa?: boolean } }) =>
      planCuentasApi.update(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["contabilidad", "plan-cuentas", empresaActiva?.empresaId] });
    },
  });
}
