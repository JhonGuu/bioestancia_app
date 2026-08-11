import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { boletasApi } from "@/modules/boletas/api/boletas.api";

/** Lista las boletas de la empresa activa. */
export function useBoletas() {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["boletas", empresaActiva?.empresaId],
    queryFn: boletasApi.list,
    enabled: !!empresaActiva,
  });
}
