import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { clientesFinalesApi } from "@/modules/clientes/api/clientes-finales.api";

/**
 * Lista los destinos de reventa de un cliente revendedor puntual (ej. los
 * locales a los que "Ivan" le reparte). `clienteId` puede venir vacío ("" —
 * todavía no se eligió cliente en el form) o `undefined`: la query queda
 * deshabilitada hasta que haya uno real.
 */
export function useClientesFinales(clienteId: string | undefined) {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["clientes-finales", empresaActiva?.empresaId, clienteId],
    queryFn: () => clientesFinalesApi.list(clienteId as string),
    enabled: !!empresaActiva && !!clienteId,
  });
}
