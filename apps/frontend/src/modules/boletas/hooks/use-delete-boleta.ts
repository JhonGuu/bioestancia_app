import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { boletasApi } from "@/modules/boletas/api/boletas.api";

/** Borra (soft-delete) una boleta entera y sus ventas — invalida boletas + ventas. */
export function useDeleteBoleta() {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: (id: string) => boletasApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["boletas", empresaActiva?.empresaId] });
      void queryClient.invalidateQueries({ queryKey: ["ventas", empresaActiva?.empresaId] });
    },
  });
}
