import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { empleadosApi } from "@/modules/empleados/api/empleados.api";

export function useEmpleado(id: string, options?: { enabled?: boolean }) {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["empleados", empresaActiva?.empresaId, id],
    queryFn: () => empleadosApi.getById(id),
    enabled: (options?.enabled ?? true) && !!empresaActiva && !!id,
  });
}
