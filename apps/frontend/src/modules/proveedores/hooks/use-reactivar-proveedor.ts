import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { proveedoresApi } from "@/modules/proveedores/api/proveedores.api";

/** Deshace el soft-delete de un proveedor (vuelve a activo) e invalida el listado. */
export function useReactivarProveedor() {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: (id: string) => proveedoresApi.reactivar(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["proveedores", empresaActiva?.empresaId],
      });
    },
  });
}
