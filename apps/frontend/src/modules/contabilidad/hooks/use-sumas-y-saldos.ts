import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { reportesContablesApi, type SumasYSaldosFiltros } from "@/modules/contabilidad/api/reportes.api";

export function useSumasYSaldos(filtros: SumasYSaldosFiltros = {}) {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["contabilidad", "reportes", "sumas-y-saldos", empresaActiva?.empresaId, filtros],
    queryFn: () => reportesContablesApi.sumasYSaldos(filtros),
    enabled: !!empresaActiva,
  });
}
