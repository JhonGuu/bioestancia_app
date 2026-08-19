import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { informesComprasApi } from "@/modules/informes-compras/api/informes-compras.api";

/** Rentabilidad de cada tropa de la empresa activa. */
export function useRentabilidadTropas() {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["informes-compras", "rentabilidad", empresaActiva?.empresaId],
    queryFn: () => informesComprasApi.rentabilidadTropas(),
    enabled: !!empresaActiva,
  });
}
