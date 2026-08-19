import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { empleadosApi } from "@/modules/empleados/api/empleados.api";
import type { CreateEmpleadoFormValues } from "@/modules/empleados/domain/empleado.schemas";

export function useUpdateEmpleado(id: string) {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: (input: CreateEmpleadoFormValues) => empleadosApi.update(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["empleados", empresaActiva?.empresaId] });
    },
  });
}
