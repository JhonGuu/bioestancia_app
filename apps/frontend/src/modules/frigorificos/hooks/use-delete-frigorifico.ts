import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { frigorificosApi } from "@/modules/frigorificos/api/frigorificos.api";

/** Elimina (soft-delete) un frigorífico e invalida el listado. */
export function useDeleteFrigorifico() {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: (id: string) => frigorificosApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["frigorificos", empresaActiva?.empresaId],
      });
    },
  });
}
