import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { chequesApi } from "@/modules/cheques/api/cheques.api";
import { EstadoCheque } from "@/modules/cheques/domain/cheque.types";

/**
 * Sugerencia (solo cálculo) de la reversión + comisión del 7% por cheque
 * rechazado — el backend responde 400 si el cheque no está en estado
 * RECHAZADO, por eso solo se pide cuando `estado` ya lo es.
 */
export function useSugerenciaRechazoCheque(chequeId: string, estado: EstadoCheque) {
  const { empresaActiva } = useAuth();
  const habilitado = !!empresaActiva && !!chequeId && estado === EstadoCheque.RECHAZADO;

  return useQuery({
    queryKey: ["cheques", empresaActiva?.empresaId, chequeId, "sugerencia-rechazo"],
    queryFn: () => chequesApi.sugerenciaRechazo(chequeId),
    enabled: habilitado,
  });
}
