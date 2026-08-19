import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { resultadoFaenaApi } from "@/modules/resultado-faena/api/resultado-faena.api";
import type { CreateResultadoFaenaFormValues } from "@/modules/resultado-faena/domain/resultado-faena.schemas";

/**
 * Carga el resultado de faena de una compra. Además del header, el backend
 * completa los campos de faena de cada `CompraCategoria` — por eso invalida
 * tanto la query propia como la de la compra (que trae esas categorías).
 */
export function useCreateResultadoFaena(compraId: string) {
  const { empresaActiva } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateResultadoFaenaFormValues) => resultadoFaenaApi.create(compraId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["resultado-faena", empresaActiva?.empresaId, compraId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["compras", empresaActiva?.empresaId, compraId],
      });
    },
  });
}
