import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { proveedoresApi } from "@/modules/proveedores/api/proveedores.api";

/** Obtiene un proveedor puntual por id (para la página de edición). */
export function useProveedor(id: string, options?: { enabled?: boolean }) {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["proveedores", empresaActiva?.empresaId, id],
    queryFn: () => proveedoresApi.getById(id),
    enabled: (options?.enabled ?? true) && !!empresaActiva && !!id,
  });
}
