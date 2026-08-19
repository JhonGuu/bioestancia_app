import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { informeCobranzasApi } from "@/modules/informe-cobranzas/api/informe-cobranzas.api";
import type { FiltrosInformeCobranzas } from "@/modules/informe-cobranzas/domain/informe-cobranzas.types";

/** Informe de cobranzas (todos los clientes), filtrable por rango de fecha y/o medio de pago. */
export function useInformeCobranzas(filtros: FiltrosInformeCobranzas) {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["informe-cobranzas", empresaActiva?.empresaId, filtros],
    queryFn: () => informeCobranzasApi.get(filtros),
    enabled: !!empresaActiva,
  });
}
