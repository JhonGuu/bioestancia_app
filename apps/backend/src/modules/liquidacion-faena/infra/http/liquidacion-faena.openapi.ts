import { z } from "zod";

import { registry } from "@/shared/infra/openapi/registry";
import { apiResponseSchema, empresaIdHeaderSchema } from "@/shared/infra/openapi/common";
import { LiquidacionFaenaValidation } from "@/modules/liquidacion-faena/infra/http/validation";

const validation = new LiquidacionFaenaValidation();

const liquidacionFaenaSchema = z.object({
  id: z.string().uuid(),
  compraId: z.string().uuid(),
  frigorificoId: z.string().uuid().nullable(),
  fecha: z.string().datetime(),
  comentarios: z.string().nullable(),
  total: z.number(),
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
  pesoBruto: z.number().nullable(),
  pesoNeto: z.number().nullable(),
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

const liquidacionFaenaConCategoriasSchema = liquidacionFaenaSchema.extend({
  categorias: z.array(compraCategoriaSchema),
});

export function registerLiquidacionFaenaOpenApi(): void {
  registry.registerPath({
    method: "post",
    path: "/compras/{compraId}/liquidacion-faena",
    tags: ["Liquidación de faena"],
    summary:
      "Carga lo que el FRIGORÍFICO cobra por faenar una compra (canon por categoría) y completa " +
      "el canon de cada línea de categoría. El total se calcula en el server como la suma de los " +
      "subtotales por categoría. Una compra tiene a lo sumo una liquidación de faena. Admin o contable.",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      params: z.object({ compraId: z.string().uuid() }),
      body: { content: { "application/json": { schema: validation.create.body } } },
    },
    responses: {
      201: {
        description: "Liquidación de faena creada, con las categorías actualizadas",
        content: {
          "application/json": { schema: apiResponseSchema(liquidacionFaenaConCategoriasSchema) },
        },
      },
      400: {
        description:
          "La compra ya tiene una liquidación de faena cargada, o alguna categoría no pertenece a la compra",
      },
      403: { description: "No sos admin/contable de la empresa activa" },
      404: { description: "La compra no existe o no pertenece a la empresa activa" },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/compras/{compraId}/liquidacion-faena",
    tags: ["Liquidación de faena"],
    summary: "Obtiene la liquidación de faena de una compra, con sus categorías",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      params: z.object({ compraId: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "OK",
        content: {
          "application/json": { schema: apiResponseSchema(liquidacionFaenaConCategoriasSchema) },
        },
      },
      404: { description: "Esta compra todavía no tiene una liquidación de faena cargada" },
    },
  });
}
