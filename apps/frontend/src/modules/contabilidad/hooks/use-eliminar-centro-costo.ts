import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { centrosCostoApi } from "@/modules/contabilidad/api/centros-costo.api";

export function useEliminarCentroCosto() {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: (id: string) => centrosCostoApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["contabilidad", "centros-costo", empresaActiva?.empresaId] });
    },
  });
}
