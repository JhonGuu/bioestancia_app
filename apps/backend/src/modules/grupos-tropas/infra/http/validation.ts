import { injectable } from "inversify";
import { z } from "zod";

const crearBody = z.object({
  compraIds: z.array(z.string().uuid("id de compra inválido")).min(2, "Hacen falta al menos 2 tropas"),
  pesoBrutoTotal: z.coerce.number().positive("pesoBrutoTotal tiene que ser mayor a 0"),
  nombre: z.string().min(1).max(100).optional(),
  comentarios: z.string().max(255).optional(),
});

@injectable()
export class GrupoTropasValidation {
  crear = { body: crearBody };

  list = {};

  getById = {
    params: z.object({
      id: z.string().uuid("Id inválido"),
    }),
  };

  cerrar = {
    params: z.object({
      id: z.string().uuid("Id inválido"),
    }),
  };

  reabrir = {
    params: z.object({
      id: z.string().uuid("Id inválido"),
    }),
  };
}
