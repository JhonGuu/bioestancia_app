import { injectable } from "inversify";
import { z } from "zod";

const categoriaBody = z.object({
  compraCategoriaId: z.string().uuid("compraCategoriaId inválido"),
  precioKg: z.coerce.number().positive("precioKg tiene que ser mayor a 0"),
  porcentajeIva: z.coerce.number().min(0).max(100),
});

const createBody = z.object({
  numeroComprobante: z.string().min(1).max(30),
  fecha: z.coerce.date(),
  fechaOperacion: z.coerce.date().optional(),
  cae: z.string().max(20).optional(),
  fechaVencimientoCae: z.coerce.date().optional(),
  totalGastos: z.coerce.number().min(0).optional(),
  ivaSobreGastos: z.coerce.number().min(0).optional(),
  totalTributos: z.coerce.number().min(0).optional(),
  comentarios: z.string().max(255).optional(),
  categorias: z.array(categoriaBody).min(1, "Tiene que venir al menos una categoría"),
});

@injectable()
export class LiquidacionCompraValidation {
  create = {
    params: z.object({ compraId: z.string().uuid("compraId inválido") }),
    body: createBody,
  };

  getByCompra = {
    params: z.object({ compraId: z.string().uuid("compraId inválido") }),
  };
}
