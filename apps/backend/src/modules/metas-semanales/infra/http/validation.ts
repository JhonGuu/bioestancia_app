import { injectable } from "inversify";
import { z } from "zod";

const progresoQuery = z.object({
  // "YYYY-MM-DD" — cualquier fecha DENTRO de la semana ISO a consultar. Si no se manda, semana actual.
  fecha: z.coerce.date().optional(),
});

@injectable()
export class MetasSemanalesValidation {
  progreso = { query: progresoQuery };
}
