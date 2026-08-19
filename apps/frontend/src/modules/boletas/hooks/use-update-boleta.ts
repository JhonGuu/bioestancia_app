import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { boletasApi } from "@/modules/boletas/api/boletas.api";

/** Corrige fecha/número/comentarios de una boleta ya cargada — invalida boletas. */
export function useUpdateBoleta() {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: { fecha?: string; numero?: string | null; comentarios?: string | null };
    }) => boletasApi.update(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["boletas", empresaActiva?.empresaId] });
    },
  });
}
