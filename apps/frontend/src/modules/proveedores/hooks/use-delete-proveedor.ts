import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { proveedoresApi } from "@/modules/proveedores/api/proveedores.api";

/** Elimina (soft-delete) un proveedor e invalida el listado. */
export function useDeleteProveedor() {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: (id: string) => proveedoresApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["proveedores", empresaActiva?.empresaId],
      });
    },
  });
}
