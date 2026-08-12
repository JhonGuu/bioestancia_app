import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { chequesApi } from "@/modules/cheques/api/cheques.api";

/** Confirma (a mano) el recargo sugerido y lo carga a la cuenta corriente del cliente. */
export function useConfirmarRecargoCheque() {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: ({ chequeId, monto }: { chequeId: string; monto?: number }) =>
      chequesApi.confirmarRecargo(chequeId, monto),
    onSuccess: (_cargo, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["cheques", empresaActiva?.empresaId] });
      void queryClient.invalidateQueries({
        queryKey: ["cheques", empresaActiva?.empresaId, variables.chequeId, "sugerencia-recargo"],
      });
      void queryClient.invalidateQueries({ queryKey: ["cuenta-corriente", empresaActiva?.empresaId] });
    },
  });
}
