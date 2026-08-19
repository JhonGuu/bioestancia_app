import { useQuery } from "@tanstack/react-query";

import { empleadosApi } from "@/modules/empleados/api/empleados.api";

export function useHorariosEmpleado(empleadoId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["empleados", "horarios", empleadoId],
    queryFn: () => empleadosApi.getHorarios(empleadoId),
    enabled: (options?.enabled ?? true) && !!empleadoId,
  });
}
