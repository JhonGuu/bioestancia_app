import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { boletasApi } from "@/modules/boletas/api/boletas.api";

/** Crea una boleta (con sus ítems, si vienen) para la empresa activa e invalida el listado. */
export function useCreateBoleta() {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: boletasApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["boletas", empresaActiva?.empresaId],
      });
    },
  });
}
