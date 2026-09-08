import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { boletasApi } from "@/modules/boletas/api/boletas.api";

/** Lista TODAS las boletas de la empresa activa, sin paginar. Para una pantalla de listado nueva, usar `useBoletasPaginado`. */
export function useBoletas() {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["boletas", empresaActiva?.empresaId],
    queryFn: boletasApi.list,
    enabled: !!empresaActiva,
  });
}

/** Lista una página de boletas de la empresa activa. `page` arranca en 1. */
export function useBoletasPaginado(page: number, limit: number) {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["boletas", "paginado", empresaActiva?.empresaId, page, limit],
    queryFn: () => boletasApi.listPaginado(page, limit),
    enabled: !!empresaActiva,
  });
}
