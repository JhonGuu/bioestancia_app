import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { comprasApi } from "@/modules/compras/api/compras.api";

/** Lista las compras de la empresa activa. */
export function useCompras() {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["compras", empresaActiva?.empresaId],
    queryFn: comprasApi.list,
    enabled: !!empresaActiva,
  });
}
