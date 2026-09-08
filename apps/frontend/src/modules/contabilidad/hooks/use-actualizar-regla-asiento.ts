import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { reglasAsientoApi, type ActualizarReglaAsientoInput } from "@/modules/contabilidad/api/reglas-asiento.api";

export function useActualizarReglaAsiento() {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ActualizarReglaAsientoInput }) =>
      reglasAsientoApi.update(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["contabilidad", "reglas-asiento", empresaActiva?.empresaId] });
    },
  });
}
