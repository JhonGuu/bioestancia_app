import { httpClient, unwrap } from "@/shared/api/http-client";
import type { BalanceHoras, PeriodoBalance } from "@/modules/balance-horas/domain/balance-horas.types";

export const balanceHorasApi = {
  /** `fecha` en formato "YYYY-MM-DD" — cualquier día dentro del período que se quiere ver. */
  calcular(periodo: PeriodoBalance, fecha: string): Promise<BalanceHoras> {
    return unwrap(httpClient.get("/personal/balance-horas", { params: { periodo, fecha } }));
  },
};
