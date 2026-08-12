import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { cobrosApi } from "@/modules/cobros/api/cobros.api";

/**
 * Crea un cobro (con sus líneas) e invalida todo lo que puede haber
 * cambiado: el listado de cobros, y el saldo/movimientos de cuenta
 * corriente del cliente (el backend aplica FIFO a boletas pendientes al
 * crearlo).
 */
export function useCreateCobro() {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: cobrosApi.create,
    onSuccess: (cobro) => {
      void queryClient.invalidateQueries({ queryKey: ["cobros", empresaActiva?.empresaId] });
      void queryClient.invalidateQueries({
        queryKey: ["cuenta-corriente", empresaActiva?.empresaId, cobro.clienteId],
      });
    },
  });
}
