import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { boletasApi } from "@/modules/boletas/api/boletas.api";

/** Trae una boleta con sus ítems (ventas) por id. */
export function useBoleta(id: string) {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["boletas", empresaActiva?.empresaId, id],
    queryFn: () => boletasApi.getById(id),
    enabled: !!empresaActiva && !!id,
  });
}
