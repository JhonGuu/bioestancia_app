import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { comprasApi } from "@/modules/compras/api/compras.api";

/** Stock teórico (compradas − vendidas) de cada tropa abierta de la empresa activa. */
export function useStockTropas() {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["compras", "stock", empresaActiva?.empresaId],
    queryFn: comprasApi.stockTropas,
    enabled: !!empresaActiva,
  });
}
