import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { planificacionCabezasApi } from "@/modules/planificacion-cabezas/api/planificacion-cabezas.api";

/**
 * Crea/actualiza el plan de un cliente para uno o más días e invalida todas
 * las consultas de planificación de la empresa activa — cualquier rango que
 * esté en pantalla (período actual, anterior, ranking) puede haber cambiado.
 */
export function useUpsertPlanificacionCabezas() {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: planificacionCabezasApi.upsert,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["planificacion-cabezas", empresaActiva?.empresaId],
      });
    },
  });
}
