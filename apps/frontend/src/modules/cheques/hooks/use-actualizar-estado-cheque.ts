import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { chequesApi } from "@/modules/cheques/api/cheques.api";
import type { EstadoCheque } from "@/modules/cheques/domain/cheque.types";

/** Cambia el estado de un cheque e invalida la cartera (lista + detalle). */
export function useActualizarEstadoCheque() {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: ({ id, estado, motivoRechazo }: { id: string; estado: EstadoCheque; motivoRechazo?: string }) =>
      chequesApi.actualizarEstado(id, estado, motivoRechazo),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cheques", empresaActiva?.empresaId] });
    },
  });
}
