import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { comprasApi } from "@/modules/compras/api/compras.api";

/** Lista TODAS las compras de la empresa activa, sin paginar. Para una pantalla de listado nueva, usar `useComprasPaginado`. */
export function useCompras() {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["compras", empresaActiva?.empresaId],
    queryFn: comprasApi.list,
    enabled: !!empresaActiva,
  });
}

/** Lista una página de compras de la empresa activa. `page` arranca en 1. */
export function useComprasPaginado(page: number, limit: number) {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["compras", "paginado", empresaActiva?.empresaId, page, limit],
    queryFn: () => comprasApi.listPaginado(page, limit),
    enabled: !!empresaActiva,
  });
}
