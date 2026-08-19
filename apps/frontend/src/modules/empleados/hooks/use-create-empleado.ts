import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { empleadosApi } from "@/modules/empleados/api/empleados.api";

export function useCreateEmpleado() {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: empleadosApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["empleados", empresaActiva?.empresaId] });
    },
  });
}
