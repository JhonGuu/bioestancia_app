import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { empleadosApi, type EstadoEmpleadoFiltro } from "@/modules/empleados/api/empleados.api";

export function useEmpleados(estado: EstadoEmpleadoFiltro = "activos") {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["empleados", empresaActiva?.empresaId, estado],
    queryFn: () => empleadosApi.list(estado),
    enabled: !!empresaActiva,
  });
}
