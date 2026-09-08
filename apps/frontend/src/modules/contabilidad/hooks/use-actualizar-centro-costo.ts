import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { centrosCostoApi } from "@/modules/contabilidad/api/centros-costo.api";
import type { CentroCostoFormValues } from "@/modules/contabilidad/domain/centro-costo.schemas";

export function useActualizarCentroCosto() {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CentroCostoFormValues> & { activo?: boolean } }) =>
      centrosCostoApi.update(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["contabilidad", "centros-costo", empresaActiva?.empresaId] });
    },
  });
}
