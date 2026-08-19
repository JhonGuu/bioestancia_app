import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { liquidacionCompraApi } from "@/modules/liquidacion-compra/api/liquidacion-compra.api";
import type { CreateLiquidacionCompraFormValues } from "@/modules/liquidacion-compra/domain/liquidacion-compra.schemas";

/**
 * Emite la liquidación de compra. Además del header, el backend completa la
 * facturación de cada `CompraCategoria` — por eso invalida tanto la query
 * propia como la de la compra (que trae esas categorías).
 */
export function useCreateLiquidacionCompra(compraId: string) {
  const { empresaActiva } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateLiquidacionCompraFormValues) => liquidacionCompraApi.create(compraId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["liquidacion-compra", empresaActiva?.empresaId, compraId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["compras", empresaActiva?.empresaId, compraId],
      });
    },
  });
}
