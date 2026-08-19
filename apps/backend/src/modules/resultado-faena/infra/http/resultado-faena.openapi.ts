import { z } from "zod";

import { registry } from "@/shared/infra/openapi/registry";
import { apiResponseSchema, empresaIdHeaderSchema } from "@/shared/infra/openapi/common";
import { ResultadoFaenaValidation } from "@/modules/resultado-faena/infra/http/validation";

const validation = new ResultadoFaenaValidation();

const resultadoFaenaSchema = z.object({
  id: z.string().uuid(),
  compraId: z.string().uuid(),
  frigorificoId: z.string().uuid().nullable(),
  fechaFaena: z.string().datetime(),
  numero: z.string().nullable(),
  numeroAutorizacion: z.string().nullable(),
  kgVivoTotal: z.number(),
  kgCarneTotal: z.number(),
  comisosKg: z.number(),
  comisosCabezas: z.number().int(),
  rendimiento: z.number(),
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
  comisosCabezas: z.number().int().nullable(),
  comisosKg: z.number().nullable(),
  precioKg: z.number().nullable(),
  importeBruto: z.number().nullable(),
  porcentajeIva: z.number().nullable(),
  importeIva: z.number().nullable(),
  canonFaenaPorAnimal: z.number().nullable(),
  canonFaenaSubtotal: z.number().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const resultadoFaenaConCategoriasSchema = resultadoFaenaSchema.extend({
  categorias: z.array(compraCategoriaSchema),
});

export function registerResultadoFaenaOpenApi(): void {
  registry.registerPath({
    method: "post",
    path: "/compras/{compraId}/resultado-faena",
    tags: ["Resultado de faena"],
    summary:
      "Carga el resultado de faena (documento SENASA del frigorífico) de una compra y completa " +
      "los campos de faena de cada línea de categoría. kgVivoTotal/kgCarneTotal/rendimiento y " +
      "comisosKg/comisosCabezas del header se calculan en el server sumando las líneas — el " +
      "decomiso sanitario se carga por categoría, no como total de tropa. Una compra tiene a lo " +
      "sumo un resultado de faena. Admin o contable.",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      params: z.object({ compraId: z.string().uuid() }),
      body: { content: { "application/json": { schema: validation.create.body } } },
    },
    responses: {
      201: {
        description: "Resultado de faena creado, con las categorías actualizadas",
        content: {
          "application/json": { schema: apiResponseSchema(resultadoFaenaConCategoriasSchema) },
        },
      },
      400: {
        description:
          "La compra ya tiene un resultado de faena cargado, o alguna categoría no pertenece a la compra",
      },
      403: { description: "No sos admin/contable de la empresa activa" },
      404: { description: "La compra no existe o no pertenece a la empresa activa" },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/compras/{compraId}/resultado-faena",
    tags: ["Resultado de faena"],
    summary: "Obtiene el resultado de faena de una compra, con sus categorías",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      params: z.object({ compraId: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "OK",
        content: {
          "application/json": { schema: apiResponseSchema(resultadoFaenaConCategoriasSchema) },
        },
      },
      404: { description: "Esta compra todavía no tiene un resultado de faena cargado" },
    },
  });
}
