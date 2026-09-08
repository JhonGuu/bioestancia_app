import { injectable } from "inversify";
import { z } from "zod";

import { optionalPaginationQuerySchema } from "@/shared/infra/http/pagination";
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
    // Solo "compensación de kg" puede ir en negativo (y siempre lo es) — ver ventas/infra/http/validation.ts.
    kg: z.coerce.number(),
    clienteFinalId: z.string().uuid("clienteFinalId inválido").optional(),
    comentarios: z.string().max(255).optional(),
  })
  .refine((data) => data.formaVenta === FormaVenta.COMPENSACION_KG || data.kg > 0, {
    message: "kg tiene que ser mayor a 0 (excepto en compensación de kg, que siempre es negativa)",
    path: ["kg"],
  })
  // Una compensación SIEMPRE resta — no existe el caso "agregado" (kg
  // positivo). El operario tipea la magnitud en positivo, el frontend la
  // manda ya en negativo (ver `boletas.api.ts`); esto es la última barrera
  // defensiva del lado del servidor.
  .refine((data) => data.formaVenta !== FormaVenta.COMPENSACION_KG || data.kg < 0, {
    message: "La compensación tiene que ser negativa",
    path: ["kg"],
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

// Corrige fecha/número/comentarios de una boleta ya cargada — para arreglar
// una carga mal hecha. Todos opcionales: el caller manda solo lo que cambió.
const updateBody = z.object({
  fecha: z.coerce.date().optional(),
  numero: z.string().max(50).nullable().optional(),
  comentarios: z.string().max(255).nullable().optional(),
});

@injectable()
export class BoletaValidation {
  create = { body: createBody };

  /**
   * `page`/`limit` opcionales a propósito: sin ninguno de los dos, GET
   * /boletas devuelve todo (compatibilidad con pantallas viejas que agregan
   * sobre el total). Pasando cualquiera de los dos, devuelve
   * `{items, pagination}`.
   */
  list = { query: optionalPaginationQuerySchema };

  getById = { params: idParams };

  pdf = { params: idParams };

  reporteDiario = { query: reporteDiarioQuery };

  update = { params: idParams, body: updateBody };

  delete = { params: idParams };
}
