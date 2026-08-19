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
    // Solo "compensación de kg" puede ir en negativo, y siempre lo es (ej.
    // descuento por un animal que vino golpeado/en mal estado, o el ajuste
    // fijo por cabeza de ciertos clientes) — el resto de las ventas son un
    // animal físico real, no puede pesar 0 o menos.
    kg: z.coerce.number(),
    // Opcional: el operario carga la venta sin precio (flujo de boletas) —
    // lo completa después admin/contable con PATCH /ventas/:id/precio.
    precioKg: z.coerce.number().positive("precioKg tiene que ser mayor a 0").optional(),
    fecha: z.coerce.date(),
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

const setPrecioLoteBody = z.object({
  ventaIds: z.array(z.string().uuid("Id inválido")).min(1, "Tenés que indicar al menos una venta"),
  precioKg: z.coerce.number().positive("precioKg tiene que ser mayor a 0"),
});

// Corrige UNA línea ya cargada (garrón/kg/categoría/comentarios) — no toca
// precioKg (eso es setPrecio, tarea de administración/contable). Todos los
// campos opcionales: el caller manda solo lo que cambió.
const updateItemBody = z.object({
  garron: z.coerce.number().int().positive().nullable().optional(),
  kg: z.coerce.number().optional(),
  categoria: categoriaVentaSchema.nullable().optional(),
  comentarios: z.string().max(255).nullable().optional(),
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

  setPrecioLote = { body: setPrecioLoteBody };

  updateItem = {
    params: z.object({
      id: z.string().uuid("Id inválido"),
    }),
    body: updateItemBody,
  };

  delete = {
    params: z.object({
      id: z.string().uuid("Id inválido"),
    }),
  };
}
