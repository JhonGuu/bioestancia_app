import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { ventasApi } from "@/modules/ventas/api/ventas.api";

/** Lista las ventas de la empresa activa. */
export function useVentas() {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["ventas", empresaActiva?.empresaId],
    queryFn: ventasApi.list,
    enabled: !!empresaActiva,
  });
}
