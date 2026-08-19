import { injectable } from "inversify";
import { z } from "zod";

import { PeriodoBalance } from "@/modules/personal/domain/balance-horas";

const calcularQuery = z.object({
  periodo: z.nativeEnum(PeriodoBalance),
  /** Cualquier fecha dentro del período a ver. Si no se manda, se usa hoy. */
  fecha: z.coerce.date().optional(),
});

@injectable()
export class BalanceHorasValidation {
  calcular = { query: calcularQuery };
}
