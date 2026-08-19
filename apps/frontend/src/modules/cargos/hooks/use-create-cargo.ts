import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { cargosApi } from "@/modules/cargos/api/cargos.api";

export function useCreateCargo() {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: cargosApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cargos", empresaActiva?.empresaId] });
    },
  });
}
