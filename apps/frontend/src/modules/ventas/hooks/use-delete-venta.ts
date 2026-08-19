import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { ventasApi } from "@/modules/ventas/api/ventas.api";

/** Borra (soft-delete) una línea de venta — invalida ventas + boletas. */
export function useDeleteVenta() {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: (id: string) => ventasApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["ventas", empresaActiva?.empresaId] });
      void queryClient.invalidateQueries({ queryKey: ["boletas", empresaActiva?.empresaId] });
    },
  });
}
