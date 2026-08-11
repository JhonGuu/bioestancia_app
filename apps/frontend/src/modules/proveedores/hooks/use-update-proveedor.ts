import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { proveedoresApi } from "@/modules/proveedores/api/proveedores.api";
import type { CreateProveedorFormValues } from "@/modules/proveedores/domain/proveedor.schemas";

/** Edita un proveedor (reemplaza todos los campos) e invalida listado + detalle. */
export function useUpdateProveedor(id: string) {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: (input: CreateProveedorFormValues) => proveedoresApi.update(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["proveedores", empresaActiva?.empresaId],
      });
    },
  });
}
