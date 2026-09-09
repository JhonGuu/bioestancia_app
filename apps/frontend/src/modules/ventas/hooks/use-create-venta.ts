import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { ventasApi } from "@/modules/ventas/api/ventas.api";

/**
 * Carga manual de una venta — ver `ventasApi.create`/`nueva-venta-form.tsx`.
 * Invalida también `compras`: `pesoFinalVenta`/`rinde` de la tropa (o del
 * grupo, si está agrupada) se recalculan recién al cerrarla, pero la carga
 * de ventas es justamente lo que hace falta antes de poder cerrar.
 */
export function useCreateVenta() {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: ventasApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["ventas", empresaActiva?.empresaId] });
      void queryClient.invalidateQueries({ queryKey: ["compras", empresaActiva?.empresaId] });
    },
  });
}
