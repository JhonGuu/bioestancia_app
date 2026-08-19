import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { frigorificosApi } from "@/modules/frigorificos/api/frigorificos.api";

/** Deshace el soft-delete de un frigorífico (vuelve a activo) e invalida el listado. */
export function useReactivarFrigorifico() {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: (id: string) => frigorificosApi.reactivar(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["frigorificos", empresaActiva?.empresaId],
      });
    },
  });
}
