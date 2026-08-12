import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { chequesApi, type ListChequesFiltro } from "@/modules/cheques/api/cheques.api";

/** Cartera de cheques de la empresa activa, filtrable por estado y/o cliente. */
export function useCheques(filtro?: ListChequesFiltro) {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["cheques", empresaActiva?.empresaId, filtro],
    queryFn: () => chequesApi.list(filtro),
    enabled: !!empresaActiva,
  });
}
