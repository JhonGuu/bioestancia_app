import { injectable } from "inversify";
import { z } from "zod";

const createBody = z.object({
  clienteId: z.string().uuid("clienteId inválido"),
  fecha: z.coerce.date(),
  numero: z.string().max(50).optional(),
  comentarios: z.string().max(255).optional(),
});

@injectable()
export class BoletaValidation {
  create = { body: createBody };

  getById = {
    params: z.object({
      id: z.string().uuid("Id inválido"),
    }),
  };
}
