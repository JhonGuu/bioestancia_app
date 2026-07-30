import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { comprasApi } from "@/modules/compras/api/compras.api";

/**
 * Trae una compra puntual (con sus líneas de categoría) de la empresa activa.
 *
 * `enabled` es opcional para poder posponer el fetch (ej. recién al abrir un
 * diálogo que necesita el detalle, como `CerrarCompraDialog` reutilizado
 * desde la tabla de listado, que no trae categorías).
 */
export function useCompra(id: string | undefined, options?: { enabled?: boolean }) {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["compras", empresaActiva?.empresaId, id],
    queryFn: () => comprasApi.getById(id!),
    enabled: !!empresaActiva && !!id && (options?.enabled ?? true),
  });
}
