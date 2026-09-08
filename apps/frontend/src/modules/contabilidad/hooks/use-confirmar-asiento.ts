import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { asientosApi } from "@/modules/contabilidad/api/asientos.api";

export function useConfirmarAsiento() {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: (id: string) => asientosApi.confirmar(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: ["contabilidad", "asientos", empresaActiva?.empresaId] });
      void queryClient.invalidateQueries({ queryKey: ["contabilidad", "asiento", empresaActiva?.empresaId, id] });
    },
  });
}
