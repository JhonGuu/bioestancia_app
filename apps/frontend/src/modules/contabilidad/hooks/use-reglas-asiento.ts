import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { reglasAsientoApi } from "@/modules/contabilidad/api/reglas-asiento.api";

export function useReglasAsiento() {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["contabilidad", "reglas-asiento", empresaActiva?.empresaId],
    queryFn: () => reglasAsientoApi.list(),
    enabled: !!empresaActiva,
  });
}
