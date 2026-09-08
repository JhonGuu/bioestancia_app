import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { centrosCostoApi } from "@/modules/contabilidad/api/centros-costo.api";

export function useCentrosCosto() {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["contabilidad", "centros-costo", empresaActiva?.empresaId],
    queryFn: () => centrosCostoApi.list(),
    enabled: !!empresaActiva,
  });
}
