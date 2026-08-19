import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { metasSemanalesApi } from "@/modules/metas-semanales/api/metas-semanales.api";

/** Progreso semanal de los clientes con meta de cabezas configurada — semana actual por default. */
export function useProgresoMetasSemanales(fecha?: string) {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["metas-semanales-progreso", empresaActiva?.empresaId, fecha],
    queryFn: () => metasSemanalesApi.getProgreso(fecha),
    enabled: !!empresaActiva,
  });
}
