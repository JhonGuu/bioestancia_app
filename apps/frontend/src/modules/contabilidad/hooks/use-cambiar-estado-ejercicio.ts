import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { ejerciciosApi } from "@/modules/contabilidad/api/ejercicios.api";
import type { EstadoEjercicio } from "@/modules/contabilidad/domain/ejercicio.types";

export function useCambiarEstadoEjercicio() {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: EstadoEjercicio }) =>
      ejerciciosApi.cambiarEstadoEjercicio(id, estado),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["contabilidad", "ejercicios", empresaActiva?.empresaId] });
    },
  });
}
