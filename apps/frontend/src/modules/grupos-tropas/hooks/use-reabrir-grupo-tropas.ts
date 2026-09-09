import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { gruposTropasApi } from "@/modules/grupos-tropas/api/grupos-tropas.api";

export function useReabrirGrupoTropas() {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: gruposTropasApi.reabrir,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["grupos-tropas", empresaActiva?.empresaId] });
      void queryClient.invalidateQueries({ queryKey: ["compras", empresaActiva?.empresaId] });
    },
  });
}
