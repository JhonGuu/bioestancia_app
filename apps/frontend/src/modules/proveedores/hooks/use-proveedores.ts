import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { proveedoresApi } from "@/modules/proveedores/api/proveedores.api";

/** Lista los proveedores de la empresa activa. */
export function useProveedores() {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["proveedores", empresaActiva?.empresaId],
    queryFn: proveedoresApi.list,
    enabled: !!empresaActiva,
  });
}
