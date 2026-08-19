import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { cabezasApi } from "@/modules/cabezas/api/cabezas.api";
import type { FiltrosInformeCabezas } from "@/modules/cabezas/domain/cabezas.types";

/** Vista "Cabezas": planificación vs. venta real por cliente, de una semana ISO puntual. */
export function useInformeCabezas(filtros: FiltrosInformeCabezas) {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["cabezas", empresaActiva?.empresaId, filtros],
    queryFn: () => cabezasApi.get(filtros),
    enabled: !!empresaActiva,
  });
}
