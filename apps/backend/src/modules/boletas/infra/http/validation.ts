import { injectable } from "inversify";
import { z } from "zod";

import { FormaVenta } from "@/modules/ventas/domain/forma-venta";
import { CategoriaPorcino } from "@/modules/compras/domain/categoria-porcino";
import { CategoriaReventa, esReventa } from "@/modules/ventas/domain/categoria-venta";

const categoriaVentaSchema = z.union([z.nativeEnum(CategoriaPorcino), z.nativeEnum(CategoriaReventa)]);

const itemBody = z
  .object({
    compraId: z.string().uuid("compraId inválido").optional(),
    garron: z.coerce.number().int().positive().optional(),
    formaVenta: z.nativeEnum(FormaVenta),
    categoria: categoriaVentaSchema.optional(),
    kg: z.coerce.number().positive("kg tiene que ser mayor a 0"),
    clienteFinalId: z.string().uuid("clienteFinalId inválido").optional(),
    comentarios: z.string().max(255).optional(),
  })
  // Mismas reglas que /ventas (ver infra/http/validation.ts de ese módulo):
  // categoría siempre excepto compensación; compraId excepto compensación o
  // reventa (Novillo); garrón solo para cabeza/media res que no sea reventa.
  .refine((data) => data.formaVenta === FormaVenta.COMPENSACION_KG || Boolean(data.categoria), {
    message: "Tenés que indicar la categoría (excepto en compensación de kg)",
    path: ["categoria"],
  })
  .refine(
    (data) =>
      data.formaVenta === FormaVenta.COMPENSACION_KG || esReventa(data.categoria) || Boolean(data.compraId),
    { message: "Tenés que indicar compraId (excepto en compensación de kg o reventa)", path: ["compraId"] },
  )
  .refine(
    (data) =>
      ![FormaVenta.CABEZA, FormaVenta.MEDIA_RES].includes(data.formaVenta) ||
      esReventa(data.categoria) ||
      Boolean(data.garron),
    {
      message: "Tenés que indicar el garrón para cabeza/media res",
      path: ["garron"],
    },
  );

const createBody = z.object({
  clienteId: z.string().uuid("clienteId inválido"),
  fecha: z.coerce.date(),
  numero: z.string().max(50).optional(),
  comentarios: z.string().max(255).optional(),
  /**
   * Ítems de la boleta (garrones/medias reses/cortes entregados). El
   * operario siempre manda al menos uno; el flujo de back-office puede
   * omitirlo y cargar las ventas después por separado.
   */
  items: z.array(itemBody).optional(),
});

const idParams = z.object({
  id: z.string().uuid("Id inválido"),
});

const reporteDiarioQuery = z.object({
  // "YYYY-MM-DD" → z.coerce.date() lo parsea siempre como medianoche UTC
  // (mismo criterio que el resto de las fechas del dominio — ver Boleta.fecha).
  fecha: z.coerce.date(),
});

@injectable()
export class BoletaValidation {
  create = { body: createBody };

  getById = { params: idParams };

  pdf = { params: idParams };

  reporteDiario = { query: reporteDiarioQuery };
}
