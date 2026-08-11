import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { clientesApi } from "@/modules/clientes/api/clientes.api";
import type { CreateClienteFormValues } from "@/modules/clientes/domain/cliente.schemas";

/** Edita un cliente (reemplaza todos los campos) e invalida listado + detalle. */
export function useUpdateCliente(id: string) {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: (input: CreateClienteFormValues) => clientesApi.update(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["clientes", empresaActiva?.empresaId],
      });
    },
  });
}
