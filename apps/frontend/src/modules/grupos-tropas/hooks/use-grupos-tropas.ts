import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { gruposTropasApi } from "@/modules/grupos-tropas/api/grupos-tropas.api";

export function useGruposTropas() {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["grupos-tropas", empresaActiva?.empresaId],
    queryFn: gruposTropasApi.list,
    enabled: !!empresaActiva,
  });
}
