import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { cuentaCorrienteApi } from "@/modules/cuenta-corriente/api/cuenta-corriente.api";

/** Saldo de cuenta corriente de un cliente — `clienteId` opcional para poder usarse antes de elegir uno. */
export function useSaldoCliente(clienteId?: string) {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["cuenta-corriente", empresaActiva?.empresaId, clienteId],
    queryFn: () => cuentaCorrienteApi.getSaldo(clienteId as string),
    enabled: !!empresaActiva && !!clienteId,
  });
}
