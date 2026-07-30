import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { comprasApi } from "@/modules/compras/api/compras.api";
import type { UpdateCompraFormValues } from "@/modules/compras/domain/compra.schemas";

/** Edita los datos generales de una compra e invalida listado + detalle. */
export function useUpdateCompra(compraId: string) {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: (input: UpdateCompraFormValues) => comprasApi.update(compraId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["compras", empresaActiva?.empresaId],
      });
    },
  });
}
