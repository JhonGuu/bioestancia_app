import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { frigorificosApi, type EstadoFrigorificoFiltro } from "@/modules/frigorificos/api/frigorificos.api";

/** Lista los frigoríficos de la empresa activa. `estado` filtra activos/inactivos/todos (default "activos"). */
export function useFrigorificos(estado: EstadoFrigorificoFiltro = "activos") {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["frigorificos", empresaActiva?.empresaId, estado],
    queryFn: () => frigorificosApi.list(estado),
    enabled: !!empresaActiva,
  });
}
