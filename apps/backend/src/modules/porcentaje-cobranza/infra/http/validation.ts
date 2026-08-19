import { injectable } from "inversify";
import { z } from "zod";

const porcentajeQuery = z.object({
  anio: z.coerce.number().int().min(2000).max(2100),
});

@injectable()
export class PorcentajeCobranzaValidation {
  porcentaje = { query: porcentajeQuery };
}
