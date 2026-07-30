import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { comprasApi } from "@/modules/compras/api/compras.api";

/** Crea una compra (con sus líneas de categoría) para la empresa activa e invalida el listado. */
export function useCreateCompra() {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: comprasApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["compras", empresaActiva?.empresaId],
      });
    },
  });
}
