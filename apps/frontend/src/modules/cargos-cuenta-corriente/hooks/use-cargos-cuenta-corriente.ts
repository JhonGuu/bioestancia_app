import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { cargosCuentaCorrienteApi } from "@/modules/cargos-cuenta-corriente/api/cargos-cuenta-corriente.api";

/** Cargos (recargo/comisión/manual) de la empresa activa, opcionalmente filtrados por cliente. */
export function useCargosCuentaCorriente(clienteId?: string) {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["cargos-cuenta-corriente", empresaActiva?.empresaId, clienteId],
    queryFn: () => cargosCuentaCorrienteApi.list(clienteId),
    enabled: !!empresaActiva,
  });
}
