import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { cargosApi } from "@/modules/cargos/api/cargos.api";

export function useReactivarCargo() {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: (id: string) => cargosApi.reactivar(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cargos", empresaActiva?.empresaId] });
    },
  });
}
