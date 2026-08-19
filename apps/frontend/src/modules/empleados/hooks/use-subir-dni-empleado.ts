import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { empleadosApi } from "@/modules/empleados/api/empleados.api";

export function useSubirDniEmpleado(empleadoId: string) {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: (archivo: File) => empleadosApi.subirDni(empleadoId, archivo),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["empleados", empresaActiva?.empresaId] });
    },
  });
}
