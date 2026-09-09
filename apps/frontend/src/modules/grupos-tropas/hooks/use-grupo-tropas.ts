import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { gruposTropasApi } from "@/modules/grupos-tropas/api/grupos-tropas.api";

export function useGrupoTropas(id: string, options?: { enabled?: boolean }) {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["grupos-tropas", empresaActiva?.empresaId, id],
    queryFn: () => gruposTropasApi.getById(id),
    enabled: !!empresaActiva && !!id && (options?.enabled ?? true),
  });
}
