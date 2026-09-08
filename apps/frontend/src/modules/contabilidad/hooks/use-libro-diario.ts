import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { reportesContablesApi, type LibroDiarioFiltros } from "@/modules/contabilidad/api/reportes.api";

export function useLibroDiario(filtros: LibroDiarioFiltros = {}) {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["contabilidad", "reportes", "diario", empresaActiva?.empresaId, filtros],
    queryFn: () => reportesContablesApi.libroDiario(filtros),
    enabled: !!empresaActiva,
  });
}
