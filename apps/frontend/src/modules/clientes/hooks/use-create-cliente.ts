import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { clientesApi } from "@/modules/clientes/api/clientes.api";

/** Crea un cliente para la empresa activa e invalida la lista en caché. */
export function useCreateCliente() {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: clientesApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["clientes", empresaActiva?.empresaId],
      });
    },
  });
}
