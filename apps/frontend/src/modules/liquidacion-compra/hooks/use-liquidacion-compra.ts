import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { liquidacionCompraApi } from "@/modules/liquidacion-compra/api/liquidacion-compra.api";

/**
 * Trae la liquidación de compra (comprobante AFIP al proveedor) de una
 * compra puntual. El caso normal de "todavía no se cargó" llega como 404 —
 * `retry: false`, mismo criterio que `useResultadoFaena`/`useLiquidacionFaena`.
 */
export function useLiquidacionCompra(compraId: string | undefined) {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["liquidacion-compra", empresaActiva?.empresaId, compraId],
    queryFn: () => liquidacionCompraApi.getByCompra(compraId!),
    enabled: !!empresaActiva && !!compraId,
    retry: false,
  });
}
