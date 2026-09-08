import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { reglasAsientoApi } from "@/modules/contabilidad/api/reglas-asiento.api";

export function useEliminarReglaAsiento() {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: (id: string) => reglasAsientoApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["contabilidad", "reglas-asiento", empresaActiva?.empresaId] });
    },
  });
}
