import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { cuentaCorrienteApi } from "@/modules/cuenta-corriente/api/cuenta-corriente.api";

/** Solo consulta si ya se eligió una cuenta de control — no tiene sentido conciliar "ninguna". */
export function useConciliacionClientes(cuentaId: string | undefined) {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["cuenta-corriente", "conciliacion", empresaActiva?.empresaId, cuentaId],
    queryFn: () => cuentaCorrienteApi.getConciliacion(cuentaId as string),
    enabled: !!empresaActiva && !!cuentaId,
  });
}
