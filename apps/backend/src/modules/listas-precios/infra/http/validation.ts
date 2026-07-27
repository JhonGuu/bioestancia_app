import { injectable } from "inversify";
import { z } from "zod";

@injectable()
export class ListaDePreciosValidation {
  create = {
    body: z.object({
      nombre: z.string().min(1, "Nombre requerido").max(100),
      descripcion: z.string().max(255).optional(),
    }),
  };

  getById = {
    params: z.object({
      id: z.string().uuid("Id inválido"),
    }),
  };
}
