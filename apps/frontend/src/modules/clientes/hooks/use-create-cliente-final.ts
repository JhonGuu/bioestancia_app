import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { clientesFinalesApi } from "@/modules/clientes/api/clientes-finales.api";

/** Crea un destino de reventa nuevo para un cliente revendedor (alta rápida desde la boleta). */
export function useCreateClienteFinal(clienteId: string | undefined) {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: (nombre: string) => clientesFinalesApi.create(clienteId as string, nombre),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["clientes-finales", empresaActiva?.empresaId, clienteId],
      });
    },
  });
}
