import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { chequesApi } from "@/modules/cheques/api/cheques.api";

/** Sugerencia (solo cálculo) del recargo del 5% por cheque entregado a más de 7 días de su fecha de cobro. */
export function useSugerenciaRecargoCheque(chequeId: string) {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["cheques", empresaActiva?.empresaId, chequeId, "sugerencia-recargo"],
    queryFn: () => chequesApi.sugerenciaRecargo(chequeId),
    enabled: !!empresaActiva && !!chequeId,
  });
}
