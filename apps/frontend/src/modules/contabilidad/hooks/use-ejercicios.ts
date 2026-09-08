import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { ejerciciosApi } from "@/modules/contabilidad/api/ejercicios.api";

export function useEjercicios() {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["contabilidad", "ejercicios", empresaActiva?.empresaId],
    queryFn: () => ejerciciosApi.list(),
    enabled: !!empresaActiva,
  });
}
