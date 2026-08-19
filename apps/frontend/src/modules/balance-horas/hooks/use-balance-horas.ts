import { useQuery } from "@tanstack/react-query";

import { balanceHorasApi } from "@/modules/balance-horas/api/balance-horas.api";
import type { PeriodoBalance } from "@/modules/balance-horas/domain/balance-horas.types";

export function useBalanceHoras(periodo: PeriodoBalance, fecha: string) {
  return useQuery({
    queryKey: ["balance-horas", periodo, fecha],
    queryFn: () => balanceHorasApi.calcular(periodo, fecha),
    enabled: !!periodo && !!fecha,
  });
}
