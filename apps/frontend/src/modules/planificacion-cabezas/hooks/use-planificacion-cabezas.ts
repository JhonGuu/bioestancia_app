import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { planificacionCabezasApi } from "@/modules/planificacion-cabezas/api/planificacion-cabezas.api";

/**
 * Lista las filas de planificación (+ ventas reales cruzadas) de la empresa
 * activa en un rango de fechas ("YYYY-MM-DD" inclusive). Se usa tanto para
 * el período visible en pantalla como para rangos "de referencia" (período
 * anterior, ranking de entregas) — `options.enabled` permite no disparar la
 * consulta hasta que haga falta (ej. el ranking solo si el usuario ordena
 * por entregas).
 */
export function usePlanificacionCabezas(
  desde: string,
  hasta: string,
  options?: { enabled?: boolean },
) {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["planificacion-cabezas", empresaActiva?.empresaId, desde, hasta],
    queryFn: () => planificacionCabezasApi.list({ desde, hasta }),
    enabled: !!empresaActiva && (options?.enabled ?? true),
  });
}
