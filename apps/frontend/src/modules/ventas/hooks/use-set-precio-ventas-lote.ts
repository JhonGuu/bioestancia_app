import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { ventasApi } from "@/modules/ventas/api/ventas.api";

/** Aplica el mismo precio a un grupo de ventas (ej. una categoría dentro de una boleta) e invalida el listado. */
export function useSetPrecioVentasLote() {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: ({ ventaIds, precioKg }: { ventaIds: string[]; precioKg: number }) =>
      ventasApi.setPrecioLote(ventaIds, precioKg),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["ventas", empresaActiva?.empresaId] });
      void queryClient.invalidateQueries({ queryKey: ["boletas", empresaActiva?.empresaId] });
    },
  });
}
