import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { resultadoFaenaApi } from "@/modules/resultado-faena/api/resultado-faena.api";

/**
 * Trae el resultado de faena de una compra puntual. El caso normal de
 * "todavía no se cargó" llega como 404 — `retry: false` para que ese estado
 * (que la página trata como vacío, no como error real) se resuelva rápido.
 * Ver `ApiError.status` en el componente que consume esta query.
 */
export function useResultadoFaena(compraId: string | undefined) {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["resultado-faena", empresaActiva?.empresaId, compraId],
    queryFn: () => resultadoFaenaApi.getByCompra(compraId!),
    enabled: !!empresaActiva && !!compraId,
    retry: false,
  });
}
