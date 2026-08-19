import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { ventasApi, type UpdateVentaItemInput } from "@/modules/ventas/api/ventas.api";

/** Corrige garrón/kg/categoría/comentarios de una línea ya cargada — invalida ventas + boletas. */
export function useUpdateVentaItem() {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateVentaItemInput }) =>
      ventasApi.updateItem(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["ventas", empresaActiva?.empresaId] });
      void queryClient.invalidateQueries({ queryKey: ["boletas", empresaActiva?.empresaId] });
    },
  });
}
