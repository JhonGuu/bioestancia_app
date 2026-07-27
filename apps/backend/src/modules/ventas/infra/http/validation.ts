import { injectable } from "inversify";
import { z } from "zod";

import { FormaVenta } from "@/modules/ventas/domain/forma-venta";

const createBody = z
  .object({
    clienteId: z.string().uuid("clienteId inválido"),
    boletaId: z.string().uuid("boletaId inválido").optional(),
    compraId: z.string().uuid("compraId inválido").optional(),
    garron: z.coerce.number().int().positive().optional(),
    formaVenta: z.nativeEnum(FormaVenta),
    kg: z.coerce.number().positive("kg tiene que ser mayor a 0"),
    precioKg: z.coerce.number().positive("precioKg tiene que ser mayor a 0"),
    fecha: z.coerce.date(),
    clienteFinalReferencia: z.string().max(255).optional(),
    comentarios: z.string().max(255).optional(),
  })
  // Regla de negocio: toda venta de un animal físico (todo menos
  // "compensación de kg") necesita compra + garrón. Una compensación es un
  // ajuste sin animal asociado, por eso no los exige.
  .refine(
    (data) =>
      data.formaVenta === FormaVenta.COMPENSACION_KG || (Boolean(data.compraId) && Boolean(data.garron)),
    {
      message: "Tenés que indicar compraId y garrón (excepto en compensación de kg)",
      path: ["garron"],
    },
  );

@injectable()
export class VentaValidation {
  create = { body: createBody };

  getById = {
    params: z.object({
      id: z.string().uuid("Id inválido"),
    }),
  };
}
