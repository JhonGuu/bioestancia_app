import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { cobrosApi } from "@/modules/cobros/api/cobros.api";

/** Lista los cobros de la empresa activa, opcionalmente filtrados por cliente. */
export function useCobros(clienteId?: string) {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["cobros", empresaActiva?.empresaId, clienteId],
    queryFn: () => cobrosApi.list(clienteId),
    enabled: !!empresaActiva,
  });
}
