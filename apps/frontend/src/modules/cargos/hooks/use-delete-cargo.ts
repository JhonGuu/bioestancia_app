import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { cargosApi } from "@/modules/cargos/api/cargos.api";

export function useDeleteCargo() {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: (id: string) => cargosApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cargos", empresaActiva?.empresaId] });
    },
  });
}
