import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { comprasApi } from "@/modules/compras/api/compras.api";

/** Cierra una compra e invalida tanto el listado como el detalle. */
export function useCerrarCompra() {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: comprasApi.cerrar,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["compras", empresaActiva?.empresaId],
      });
    },
  });
}
