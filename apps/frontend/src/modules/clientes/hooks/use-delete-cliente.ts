import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { clientesApi } from "@/modules/clientes/api/clientes.api";

/** Elimina (soft-delete) un cliente e invalida el listado. */
export function useDeleteCliente() {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: (id: string) => clientesApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["clientes", empresaActiva?.empresaId],
      });
    },
  });
}
