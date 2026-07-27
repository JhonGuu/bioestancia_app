import { z } from "zod";

import { registry } from "@/shared/infra/openapi/registry";
import { apiResponseSchema, empresaIdHeaderSchema } from "@/shared/infra/openapi/common";
import { VentaValidation } from "@/modules/ventas/infra/http/validation";
import { FormaVenta } from "@/modules/ventas/domain/forma-venta";

const validation = new VentaValidation();

const ventaSchema = z.object({
  id: z.string().uuid(),
  empresaId: z.string().uuid(),
  clienteId: z.string().uuid(),
  boletaId: z.string().uuid().nullable(),
  compraId: z.string().uuid().nullable(),
  garron: z.number().int().nullable(),
  formaVenta: z.nativeEnum(FormaVenta),
  kg: z.number(),
  precioKg: z.number(),
  total: z.number(),
  fecha: z.string().datetime(),
  clienteFinalReferencia: z.string().nullable(),
  comentarios: z.string().nullable(),
  activo: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export function registerVentasOpenApi(): void {
  registry.registerPath({
    method: "post",
    path: "/ventas",
    tags: ["Ventas"],
    summary:
      "Crea una venta (una cabeza, o un ajuste de compensación de kg) para la empresa activa. " +
      "El total se calcula en el server (kg × precioKg), no se recibe del cliente. Admin o contable.",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      body: { content: { "application/json": { schema: validation.create.body } } },
    },
    responses: {
      201: {
        description: "Venta creada",
        content: { "application/json": { schema: apiResponseSchema(ventaSchema) } },
      },
      400: { description: "Falta compraId/garrón (obligatorios salvo compensación de kg)" },
      403: { description: "No sos admin/contable de la empresa activa" },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/ventas",
    tags: ["Ventas"],
    summary: "Lista las ventas de la empresa activa",
    security: [{ bearerAuth: [] }],
    request: { headers: empresaIdHeaderSchema },
    responses: {
      200: {
        description: "OK",
        content: { "application/json": { schema: apiResponseSchema(z.array(ventaSchema)) } },
      },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/ventas/{id}",
    tags: ["Ventas"],
    summary: "Obtiene una venta de la empresa activa por id",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "OK",
        content: { "application/json": { schema: apiResponseSchema(ventaSchema) } },
      },
      404: { description: "No existe o no pertenece a la empresa activa" },
    },
  });
}
