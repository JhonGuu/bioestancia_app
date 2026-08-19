import { injectable } from "inversify";
import { z } from "zod";

const categoriaBody = z.object({
  compraCategoriaId: z.string().uuid("compraCategoriaId inválido"),
  // $/animal — ya combina lo facturado (Precio A) + lo efectivo (Precio B), no se separan.
  canonPorAnimal: z.coerce.number().positive("canonPorAnimal tiene que ser mayor a 0"),
});

const createBody = z.object({
  frigorificoId: z.string().uuid("frigorificoId inválido").optional(),
  fecha: z.coerce.date(),
  comentarios: z.string().max(255).optional(),
  categorias: z.array(categoriaBody).min(1, "Tiene que venir al menos una categoría"),
});

@injectable()
export class LiquidacionFaenaValidation {
  create = {
    params: z.object({ compraId: z.string().uuid("compraId inválido") }),
    body: createBody,
  };

  getByCompra = {
    params: z.object({ compraId: z.string().uuid("compraId inválido") }),
  };
}
