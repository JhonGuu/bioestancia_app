import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { ventasApi } from "@/modules/ventas/api/ventas.api";

/** Completa/corrige el precio de una venta e invalida el listado de ventas. */
export function useSetPrecioVenta() {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: ({ id, precioKg }: { id: string; precioKg: number }) => ventasApi.setPrecio(id, precioKg),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["ventas", empresaActiva?.empresaId] });
      void queryClient.invalidateQueries({ queryKey: ["boletas", empresaActiva?.empresaId] });
    },
  });
}
