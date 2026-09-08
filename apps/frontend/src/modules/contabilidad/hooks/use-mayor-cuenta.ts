import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { reportesContablesApi, type MayorCuentaFiltros } from "@/modules/contabilidad/api/reportes.api";

/** Solo consulta si ya se eligió una cuenta — no tiene sentido pedir el mayor de "ninguna". */
export function useMayorCuenta(filtros: MayorCuentaFiltros | undefined) {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["contabilidad", "reportes", "mayor", empresaActiva?.empresaId, filtros],
    queryFn: () => reportesContablesApi.mayorCuenta(filtros as MayorCuentaFiltros),
    enabled: !!empresaActiva && !!filtros?.cuentaId,
  });
}
