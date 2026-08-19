import { injectable } from "inversify";
import { z } from "zod";

const idParams = z.object({ id: z.string().uuid("Id inválido") });

const rangoQuery = z.object({
  desde: z.coerce.date(),
  hasta: z.coerce.date(),
});

@injectable()
export class JornadaValidation {
  calcular = { params: idParams, query: rangoQuery };
}
