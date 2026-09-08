import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { planCuentasApi } from "@/modules/contabilidad/api/plan-cuentas.api";
import { construirArbolCuentas } from "@/modules/contabilidad/domain/cuenta.types";

/** Plan de cuentas de la empresa activa, ya armado en árbol. */
export function usePlanCuentas() {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["contabilidad", "plan-cuentas", empresaActiva?.empresaId],
    queryFn: () => planCuentasApi.list(),
    enabled: !!empresaActiva,
    select: (data) => ({ cuentas: data.cuentas, arbol: construirArbolCuentas(data.cuentas) }),
  });
}
