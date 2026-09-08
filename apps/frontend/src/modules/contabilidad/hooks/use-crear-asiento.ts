import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { asientosApi } from "@/modules/contabilidad/api/asientos.api";

export function useCrearAsiento() {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: asientosApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["contabilidad", "asientos", empresaActiva?.empresaId] });
    },
  });
}
