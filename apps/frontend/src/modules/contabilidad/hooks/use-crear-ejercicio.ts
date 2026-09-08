import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { ejerciciosApi } from "@/modules/contabilidad/api/ejercicios.api";

export function useCrearEjercicio() {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: ejerciciosApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["contabilidad", "ejercicios", empresaActiva?.empresaId] });
    },
  });
}
