import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { frigorificosApi } from "@/modules/frigorificos/api/frigorificos.api";

/** Crea un frigorífico para la empresa activa e invalida la lista en caché. */
export function useCreateFrigorifico() {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: frigorificosApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["frigorificos", empresaActiva?.empresaId],
      });
    },
  });
}
