import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { asientosApi } from "@/modules/contabilidad/api/asientos.api";

export function useAsiento(id: string | undefined) {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["contabilidad", "asiento", empresaActiva?.empresaId, id],
    queryFn: () => asientosApi.getById(id as string),
    enabled: !!empresaActiva && !!id,
  });
}
