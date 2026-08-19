import { useQuery } from "@tanstack/react-query";

import { jornadasApi } from "@/modules/jornadas/api/jornadas.api";

export function useJornadasEmpleado(empleadoId: string, desde: string, hasta: string) {
  return useQuery({
    queryKey: ["jornadas", empleadoId, desde, hasta],
    queryFn: () => jornadasApi.calcular(empleadoId, desde, hasta),
    enabled: !!empleadoId && !!desde && !!hasta,
  });
}
