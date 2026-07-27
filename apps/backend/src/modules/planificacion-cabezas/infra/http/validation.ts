import { injectable } from "inversify";
import { z } from "zod";

const diaBody = z.object({
  fecha: z.coerce.date(),
  cabezasPlanificadas: z.coerce.number().int().min(0, "cabezasPlanificadas no puede ser negativo"),
  comentarios: z.string().max(255).optional(),
});

const upsertBody = z.object({
  clienteId: z.string().uuid("clienteId inválido"),
  dias: z.array(diaBody).min(1, "Tiene que venir al menos un día"),
});

const listQuery = z.object({
  desde: z.coerce.date(),
  hasta: z.coerce.date(),
  clienteId: z.string().uuid("clienteId inválido").optional(),
});

@injectable()
export class PlanificacionCabezasValidation {
  upsert = { body: upsertBody };

  list = { query: listQuery };
}
