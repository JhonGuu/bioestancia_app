import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { cargosApi } from "@/modules/cargos/api/cargos.api";

export function useCargo(id: string, options?: { enabled?: boolean }) {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["cargos", empresaActiva?.empresaId, id],
    queryFn: () => cargosApi.getById(id),
    enabled: (options?.enabled ?? true) && !!empresaActiva && !!id,
  });
}
