import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { liquidacionFaenaApi } from "@/modules/liquidacion-faena/api/liquidacion-faena.api";

/**
 * Trae la liquidación de faena de una compra puntual. El caso normal de
 * "todavía no se cargó" llega como 404 — `retry: false`, mismo criterio que
 * `useResultadoFaena`.
 */
export function useLiquidacionFaena(compraId: string | undefined) {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["liquidacion-faena", empresaActiva?.empresaId, compraId],
    queryFn: () => liquidacionFaenaApi.getByCompra(compraId!),
    enabled: !!empresaActiva && !!compraId,
    retry: false,
  });
}
