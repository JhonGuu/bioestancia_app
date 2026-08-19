import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { frigorificosApi } from "@/modules/frigorificos/api/frigorificos.api";

/** Obtiene un frigorífico puntual por id (para la página de edición). */
export function useFrigorifico(id: string, options?: { enabled?: boolean }) {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["frigorificos", empresaActiva?.empresaId, id],
    queryFn: () => frigorificosApi.getById(id),
    enabled: (options?.enabled ?? true) && !!empresaActiva && !!id,
  });
}
