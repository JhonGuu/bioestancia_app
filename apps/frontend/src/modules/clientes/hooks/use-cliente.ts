import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { clientesApi } from "@/modules/clientes/api/clientes.api";

/** Obtiene un cliente puntual por id (para la página de edición). */
export function useCliente(id: string, options?: { enabled?: boolean }) {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["clientes", empresaActiva?.empresaId, id],
    queryFn: () => clientesApi.getById(id),
    enabled: (options?.enabled ?? true) && !!empresaActiva && !!id,
  });
}
