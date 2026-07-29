import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { clientesApi } from "@/modules/clientes/api/clientes.api";

/** Lista los clientes de la empresa activa. */
export function useClientes() {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["clientes", empresaActiva?.empresaId],
    queryFn: clientesApi.list,
    enabled: !!empresaActiva,
  });
}
