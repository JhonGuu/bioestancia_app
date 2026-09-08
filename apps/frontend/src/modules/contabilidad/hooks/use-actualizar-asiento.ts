import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { asientosApi } from "@/modules/contabilidad/api/asientos.api";
import type { AsientoFormValues } from "@/modules/contabilidad/domain/asiento.schemas";

export function useActualizarAsiento() {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<AsientoFormValues> }) =>
      asientosApi.update(id, input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["contabilidad", "asientos", empresaActiva?.empresaId] });
      void queryClient.invalidateQueries({
        queryKey: ["contabilidad", "asiento", empresaActiva?.empresaId, variables.id],
      });
    },
  });
}
