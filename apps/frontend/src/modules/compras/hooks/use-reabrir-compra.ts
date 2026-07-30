import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { comprasApi } from "@/modules/compras/api/compras.api";

/** Deshace el cierre de una compra e invalida tanto el listado como el detalle. */
export function useReabrirCompra() {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: comprasApi.reabrir,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["compras", empresaActiva?.empresaId],
      });
    },
  });
}
