import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { chequesApi } from "@/modules/cheques/api/cheques.api";

/** Trae un cheque por id. */
export function useCheque(id: string) {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["cheques", empresaActiva?.empresaId, id],
    queryFn: () => chequesApi.getById(id),
    enabled: !!empresaActiva && !!id,
  });
}
