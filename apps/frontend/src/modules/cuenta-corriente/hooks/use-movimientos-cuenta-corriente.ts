import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { cuentaCorrienteApi } from "@/modules/cuenta-corriente/api/cuenta-corriente.api";

/** Línea de tiempo de movimientos de cuenta corriente de un cliente. */
export function useMovimientosCuentaCorriente(clienteId: string) {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["cuenta-corriente", empresaActiva?.empresaId, clienteId, "movimientos"],
    queryFn: () => cuentaCorrienteApi.getMovimientos(clienteId),
    enabled: !!empresaActiva && !!clienteId,
  });
}
