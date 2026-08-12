import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { chequesApi } from "@/modules/cheques/api/cheques.api";

/**
 * Confirma (a mano) el rechazo de un cheque: revierte lo aplicado a boletas
 * (LIFO) y carga la comisión del 7% — invalida cheques, cobros (cambian las
 * aplicaciones) y cuenta corriente.
 */
export function useConfirmarRechazoCheque() {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: ({ chequeId, comision }: { chequeId: string; comision?: number }) =>
      chequesApi.confirmarRechazo(chequeId, comision),
    onSuccess: (_resultado, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["cheques", empresaActiva?.empresaId] });
      void queryClient.invalidateQueries({
        queryKey: ["cheques", empresaActiva?.empresaId, variables.chequeId, "sugerencia-rechazo"],
      });
      void queryClient.invalidateQueries({ queryKey: ["cobros", empresaActiva?.empresaId] });
      void queryClient.invalidateQueries({ queryKey: ["cuenta-corriente", empresaActiva?.empresaId] });
    },
  });
}
