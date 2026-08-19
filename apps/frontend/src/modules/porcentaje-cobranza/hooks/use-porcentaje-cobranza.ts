import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { porcentajeCobranzaApi } from "@/modules/porcentaje-cobranza/api/porcentaje-cobranza.api";

/** % de cobranza de deuda vencida por cliente, semana a semana (ISO), de un año puntual. */
export function usePorcentajeCobranza(anio: number) {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["porcentaje-cobranza", empresaActiva?.empresaId, anio],
    queryFn: () => porcentajeCobranzaApi.getPorcentajeCobranza(anio),
    enabled: !!empresaActiva,
  });
}
