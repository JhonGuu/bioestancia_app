import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { liquidacionCompraApi } from "@/modules/liquidacion-compra/api/liquidacion-compra.api";

/**
 * Le pide el CAE a AFIP para una liquidación ya cargada. Puede fallar con
 * 501 si el ambiente todavía no tiene el certificado digital configurado
 * (ver `apps/backend/src/shared/infra/afip/README.md`) — la página muestra
 * ese mensaje tal cual viene del backend, no lo reinterpreta.
 */
export function useEmitirCaeLiquidacionCompra(compraId: string) {
  const { empresaActiva } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => liquidacionCompraApi.emitirCae(compraId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["liquidacion-compra", empresaActiva?.empresaId, compraId],
      });
    },
  });
}
