import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { reglasAsientoApi } from "@/modules/contabilidad/api/reglas-asiento.api";

/** Catálogo de eventos de negocio que pueden disparar un asiento automático, con sus expresiones/auxiliares válidos. Es estático por empresa — se puede cachear largo. */
export function useEventosAsiento() {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["contabilidad", "reglas-asiento", "eventos", empresaActiva?.empresaId],
    queryFn: () => reglasAsientoApi.listEventos(),
    enabled: !!empresaActiva,
    staleTime: 5 * 60 * 1000,
  });
}
