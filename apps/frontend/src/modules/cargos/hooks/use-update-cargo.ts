import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { cargosApi } from "@/modules/cargos/api/cargos.api";
import type { CreateCargoFormValues } from "@/modules/cargos/domain/cargo.schemas";

export function useUpdateCargo(id: string) {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: (input: CreateCargoFormValues) => cargosApi.update(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cargos", empresaActiva?.empresaId] });
    },
  });
}
