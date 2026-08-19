import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { empleadosApi } from "@/modules/empleados/api/empleados.api";

export function useReactivarEmpleado() {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: (id: string) => empleadosApi.reactivar(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["empleados", empresaActiva?.empresaId] });
    },
  });
}
