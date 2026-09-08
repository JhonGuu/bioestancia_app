import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { asientosApi, type ListarAsientosFiltros } from "@/modules/contabilidad/api/asientos.api";

/** Libro diario "crudo": listado de asientos con filtros, para la pantalla de carga/listado. */
export function useAsientos(filtros: ListarAsientosFiltros = {}) {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["contabilidad", "asientos", empresaActiva?.empresaId, filtros],
    queryFn: () => asientosApi.list(filtros),
    enabled: !!empresaActiva,
  });
}
