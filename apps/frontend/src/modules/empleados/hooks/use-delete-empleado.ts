import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { empleadosApi } from "@/modules/empleados/api/empleados.api";

export function useDeleteEmpleado() {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: (id: string) => empleadosApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["empleados", empresaActiva?.empresaId] });
    },
  });
}
