import { injectable } from "inversify";
import { z } from "zod";

import { MedioPago } from "@/modules/cobros/domain/medio-pago";

const filtrosQuery = z.object({
  desde: z.coerce.date().optional(),
  hasta: z.coerce.date().optional(),
  medioPago: z.nativeEnum(MedioPago).optional(),
});

@injectable()
export class InformeCobranzasValidation {
  get = { query: filtrosQuery };

  pdf = { query: filtrosQuery };

  excel = { query: filtrosQuery };
}
