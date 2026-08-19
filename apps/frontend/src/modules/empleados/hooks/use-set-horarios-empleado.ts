import { useMutation, useQueryClient } from "@tanstack/react-query";

import { empleadosApi } from "@/modules/empleados/api/empleados.api";

export function useSetHorariosEmpleado(empleadoId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (horarios: { diaSemana: number; horaEntrada: string | null; horaSalida: string | null }[]) =>
      empleadosApi.setHorarios(empleadoId, horarios),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["empleados", "horarios", empleadoId] });
    },
  });
}
