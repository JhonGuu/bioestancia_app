import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { proveedoresApi } from "@/modules/proveedores/api/proveedores.api";

/** Crea un proveedor para la empresa activa e invalida la lista en caché. */
export function useCreateProveedor() {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: proveedoresApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["proveedores", empresaActiva?.empresaId],
      });
    },
  });
}
