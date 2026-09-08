import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { ejerciciosApi } from "@/modules/contabilidad/api/ejercicios.api";
import type { EstadoPeriodo } from "@/modules/contabilidad/domain/ejercicio.types";

export function useCambiarEstadoPeriodo() {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: EstadoPeriodo }) =>
      ejerciciosApi.cambiarEstadoPeriodo(id, estado),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["contabilidad", "ejercicios", empresaActiva?.empresaId] });
    },
  });
}
