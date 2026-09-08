import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { cobrosApi } from "@/modules/cobros/api/cobros.api";

/** Lista TODOS los cobros de la empresa activa, sin paginar, opcionalmente filtrados por cliente. Para una pantalla de listado nueva, usar `useCobrosPaginado`. */
export function useCobros(clienteId?: string) {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["cobros", empresaActiva?.empresaId, clienteId],
    queryFn: () => cobrosApi.list(clienteId),
    enabled: !!empresaActiva,
  });
}

/** Lista una página de cobros de la empresa activa, opcionalmente filtrados por cliente. `page` arranca en 1. */
export function useCobrosPaginado(page: number, limit: number, clienteId?: string) {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["cobros", "paginado", empresaActiva?.empresaId, page, limit, clienteId],
    queryFn: () => cobrosApi.listPaginado(page, limit, clienteId),
    enabled: !!empresaActiva,
  });
}
