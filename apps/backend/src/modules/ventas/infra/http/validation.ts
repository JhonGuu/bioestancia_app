import { injectable } from "inversify";
import { z } from "zod";

import { FormaVenta } from "@/modules/ventas/domain/forma-venta";
import { CategoriaPorcino } from "@/modules/compras/domain/categoria-porcino";
import { CategoriaReventa, esReventa } from "@/modules/ventas/domain/categoria-venta";

const categoriaVentaSchema = z.union([z.nativeEnum(CategoriaPorcino), z.nativeEnum(CategoriaReventa)]);

const createBody = z
  .object({
    clienteId: z.string().uuid("clienteId inválido"),
    boletaId: z.string().uuid("boletaId inválido").optional(),
    compraId: z.string().uuid("compraId inválido").optional(),
    garron: z.coerce.number().int().positive().optional(),
    formaVenta: z.nativeEnum(FormaVenta),
    categoria: categoriaVentaSchema.optional(),
    kg: z.coerce.number().positive("kg tiene que ser mayor a 0"),
    // Opcional: el operario carga la venta sin precio (flujo de boletas) —
    // lo completa después admin/contable con PATCH /ventas/:id/precio.
    precioKg: z.coerce.number().positive("precioKg tiene que ser mayor a 0").optional(),
    fecha: z.coerce.date(),
    clienteFinalId: z.string().uuid("clienteFinalId inválido").optional(),
    comentarios: z.string().max(255).optional(),
  })
  // Regla de negocio: toda venta de un animal físico (todo menos
  // "compensación de kg") necesita categoría. Una compensación es un ajuste
  // sin animal asociado, por eso no la exige.
  .refine((data) => data.formaVenta === FormaVenta.COMPENSACION_KG || Boolean(data.categoria), {
    message: "Tenés que indicar la categoría (excepto en compensación de kg)",
    path: ["categoria"],
  })
  // `compraId` hace falta salvo compensación o reventa (Novillo, etc. — no
  // sale de ninguna tropa nuestra, ver `categoria-venta.ts`).
  .refine(
    (data) =>
      data.formaVenta === FormaVenta.COMPENSACION_KG || esReventa(data.categoria) || Boolean(data.compraId),
    { message: "Tenés que indicar compraId (excepto en compensación de kg o reventa)", path: ["compraId"] },
  )
  // Garrón solo hace falta cuando se vende un animal NUESTRO identificable
  // entero o por mitad — una pulpa, una compensación, o una reventa (no hay
  // registro propio de ese animal) no lo necesitan.
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

const setPrecioBody = z.object({
  precioKg: z.coerce.number().positive("precioKg tiene que ser mayor a 0"),
});

@injectable()
export class VentaValidation {
  create = { body: createBody };

  getById = {
    params: z.object({
      id: z.string().uuid("Id inválido"),
    }),
  };

  setPrecio = {
    params: z.object({
      id: z.string().uuid("Id inválido"),
    }),
    body: setPrecioBody,
  };
}
