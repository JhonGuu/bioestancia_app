import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { cuentaCorrienteApi } from "@/modules/cuenta-corriente/api/cuenta-corriente.api";

/** Saldo de cuenta corriente de todos los clientes de la empresa activa — para el listado de cuenta corriente. */
export function useSaldosClientes() {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["cuenta-corriente-saldos", empresaActiva?.empresaId],
    queryFn: () => cuentaCorrienteApi.getSaldos(),
    enabled: !!empresaActiva,
  });
}
