import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { ventasApi } from "@/modules/ventas/api/ventas.api";

/** Lista TODAS las ventas de la empresa activa, sin paginar (dashboard, precios pendientes). Para una pantalla de listado nueva, usar `useVentasPaginado`. */
export function useVentas() {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["ventas", empresaActiva?.empresaId],
    queryFn: ventasApi.list,
    enabled: !!empresaActiva,
  });
}

/** Lista una página de ventas de la empresa activa. `page` arranca en 1. */
export function useVentasPaginado(page: number, limit: number) {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["ventas", "paginado", empresaActiva?.empresaId, page, limit],
    queryFn: () => ventasApi.listPaginado(page, limit),
    enabled: !!empresaActiva,
  });
}
