import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { cargosApi, type EstadoCargoFiltro } from "@/modules/cargos/api/cargos.api";

export function useCargos(estado: EstadoCargoFiltro = "activos") {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["cargos", empresaActiva?.empresaId, estado],
    queryFn: () => cargosApi.list(estado),
    enabled: !!empresaActiva,
  });
}
