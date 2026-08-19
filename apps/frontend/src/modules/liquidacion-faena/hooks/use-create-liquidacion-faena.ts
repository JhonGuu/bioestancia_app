import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { liquidacionFaenaApi } from "@/modules/liquidacion-faena/api/liquidacion-faena.api";
import type { CreateLiquidacionFaenaFormValues } from "@/modules/liquidacion-faena/domain/liquidacion-faena.schemas";

/**
 * Carga la liquidación de faena de una compra. Además del header, el backend
 * completa el canon de cada `CompraCategoria` — por eso invalida tanto la
 * query propia como la de la compra (que trae esas categorías).
 */
export function useCreateLiquidacionFaena(compraId: string) {
  const { empresaActiva } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateLiquidacionFaenaFormValues) => liquidacionFaenaApi.create(compraId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["liquidacion-faena", empresaActiva?.empresaId, compraId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["compras", empresaActiva?.empresaId, compraId],
      });
    },
  });
}
