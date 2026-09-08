import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { reglasAsientoApi, type CrearReglaAsientoInput } from "@/modules/contabilidad/api/reglas-asiento.api";

export function useCrearReglaAsiento() {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: (input: CrearReglaAsientoInput) => reglasAsientoApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["contabilidad", "reglas-asiento", empresaActiva?.empresaId] });
    },
  });
}
