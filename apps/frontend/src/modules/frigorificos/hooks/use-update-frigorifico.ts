import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { frigorificosApi } from "@/modules/frigorificos/api/frigorificos.api";
import type { CreateFrigorificoFormValues } from "@/modules/frigorificos/domain/frigorifico.schemas";

/** Edita un frigorífico (reemplaza todos los campos) e invalida listado + detalle. */
export function useUpdateFrigorifico(id: string) {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: (input: CreateFrigorificoFormValues) => frigorificosApi.update(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["frigorificos", empresaActiva?.empresaId],
      });
    },
  });
}
