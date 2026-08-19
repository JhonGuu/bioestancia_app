import { z } from "zod";

import { registry } from "@/shared/infra/openapi/registry";
import { apiResponseSchema, empresaIdHeaderSchema } from "@/shared/infra/openapi/common";
import { LiquidacionCompraValidation } from "@/modules/liquidacion-compra/infra/http/validation";

const validation = new LiquidacionCompraValidation();

const liquidacionCompraSchema = z.object({
  id: z.string().uuid(),
  compraId: z.string().uuid(),
  numeroComprobante: z.string(),
  fecha: z.string().datetime(),
  fechaOperacion: z.string().datetime().nullable(),
  cae: z.string().nullable(),
  fechaVencimientoCae: z.string().datetime().nullable(),
  importeBruto: z.number(),
  ivaSobreBruto: z.number(),
  totalGastos: z.number().nullable(),
  ivaSobreGastos: z.number().nullable(),
  totalTributos: z.number().nullable(),
  importeNeto: z.number(),
  comentarios: z.string().nullable(),
  activo: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const compraCategoriaSchema = z.object({
  id: z.string().uuid(),
  compraId: z.string().uuid(),
  categoria: z.string(),
  raza: z.string().nullable(),
  cabezas: z.number().int(),
  pesoBruto: z.number(),
  pesoNeto: z.number(),
  kgVivoFaena: z.number().nullable(),
  kgCarne: z.number().nullable(),
  porcentajeMagro: z.number().nullable(),
  destinoComercial: z.string().nullable(),
  cuartosDelantero: z.number().int().nullable(),
  cuartosTrasero: z.number().int().nullable(),
  precioKg: z.number().nullable(),
  importeBruto: z.number().nullable(),
  porcentajeIva: z.number().nullable(),
  importeIva: z.number().nullable(),
  canonFaenaPorAnimal: z.number().nullable(),
  canonFaenaSubtotal: z.number().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const liquidacionCompraConCategoriasSchema = liquidacionCompraSchema.extend({
  categorias: z.array(compraCategoriaSchema),
});

export function registerLiquidacionCompraOpenApi(): void {
  registry.registerPath({
    method: "post",
    path: "/compras/{compraId}/liquidacion",
    tags: ["Liquidación de compra"],
    summary:
      "Emite la liquidación de compra (comprobante AFIP que se le manda al criadero) sobre el " +
      "kg vivo de faena de cada categoría — requiere que la compra ya tenga resultado de faena " +
      "cargado. importeBruto/ivaSobreBruto/importeNeto se calculan en el server. Una compra tiene " +
      "a lo sumo una liquidación. Admin o contable.",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      params: z.object({ compraId: z.string().uuid() }),
      body: { content: { "application/json": { schema: validation.create.body } } },
    },
    responses: {
      201: {
        description: "Liquidación creada, con las categorías actualizadas",
        content: {
          "application/json": { schema: apiResponseSchema(liquidacionCompraConCategoriasSchema) },
        },
      },
      400: {
        description:
          "La compra ya tiene una liquidación cargada, alguna categoría no pertenece a la compra, " +
          "o alguna categoría todavía no tiene resultado de faena cargado",
      },
      403: { description: "No sos admin/contable de la empresa activa" },
      404: { description: "La compra no existe o no pertenece a la empresa activa" },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/compras/{compraId}/liquidacion",
    tags: ["Liquidación de compra"],
    summary: "Obtiene la liquidación de una compra, con sus categorías",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      params: z.object({ compraId: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "OK",
        content: {
          "application/json": { schema: apiResponseSchema(liquidacionCompraConCategoriasSchema) },
        },
      },
      404: { description: "Esta compra todavía no tiene una liquidación cargada" },
    },
  });
}
