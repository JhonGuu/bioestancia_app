import { z } from "zod";

import { registry } from "@/shared/infra/openapi/registry";
import { apiResponseSchema, empresaIdHeaderSchema } from "@/shared/infra/openapi/common";
import { CompraValidation } from "@/modules/compras/infra/http/validation";
import { EspecieAnimal } from "@/modules/compras/domain/especie-animal";

const validation = new CompraValidation();

const compraSchema = z.object({
  id: z.string().uuid(),
  empresaId: z.string().uuid(),
  proveedorId: z.string().uuid(),
  numero: z.string(),
  especie: z.nativeEnum(EspecieAnimal),
  letra: z.string().nullable(),
  fecha: z.string().datetime(),
  dte: z.string(),
  remito: z.string(),
  porcentajeDesbaste: z.number(),
  cerrada: z.boolean(),
  fechaCierre: z.string().datetime().nullable(),
  pesoFinalVenta: z.number().nullable(),
  rinde: z.number().nullable(),
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
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const compraConCategoriasSchema = compraSchema.extend({
  categorias: z.array(compraCategoriaSchema),
});

export function registerComprasOpenApi(): void {
  registry.registerPath({
    method: "post",
    path: "/compras",
    tags: ["Compras"],
    summary:
      "Crea una compra (lote de animales a un proveedor) con sus líneas de categoría/raza " +
      "para la empresa activa. El remito/DTE real ya viene separado por categoría (ej. " +
      "\"30 machos + 90 hembras\"), por eso `categorias` es un array con al menos una línea. " +
      "`pesoNeto` de cada línea se calcula en el server (pesoBruto × (1 - porcentajeDesbaste/100)). " +
      "Si no se manda porcentajeDesbaste, se usa el del proveedor. Admin o contable.",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      body: { content: { "application/json": { schema: validation.create.body } } },
    },
    responses: {
      201: {
        description: "Compra creada, con sus categorías",
        content: { "application/json": { schema: apiResponseSchema(compraConCategoriasSchema) } },
      },
      400: {
        description:
          "No se mandó porcentajeDesbaste y el proveedor tampoco tiene uno cargado por defecto, " +
          "o no se mandó ninguna categoría",
      },
      403: { description: "No sos admin/contable de la empresa activa" },
      404: { description: "El proveedorId no existe en la empresa activa" },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/compras",
    tags: ["Compras"],
    summary: "Lista las compras de la empresa activa (sin el detalle de categorías)",
    security: [{ bearerAuth: [] }],
    request: { headers: empresaIdHeaderSchema },
    responses: {
      200: {
        description: "OK",
        content: { "application/json": { schema: apiResponseSchema(z.array(compraSchema)) } },
      },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/compras/{id}",
    tags: ["Compras"],
    summary: "Obtiene una compra de la empresa activa por id, con sus líneas de categoría",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "OK",
        content: { "application/json": { schema: apiResponseSchema(compraConCategoriasSchema) } },
      },
      404: { description: "No existe o no pertenece a la empresa activa" },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/compras/{id}/cerrar",
    tags: ["Compras"],
    summary:
      "Cierra una compra: reconcilia cabezas vendidas (garrones distintos en ventas) contra " +
      "la suma de cabezas de sus categorías, y si coinciden calcula pesoFinalVenta y rinde. Admin o contable.",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "Compra cerrada",
        content: { "application/json": { schema: apiResponseSchema(compraSchema) } },
      },
      400: {
        description: "La compra ya está cerrada, o las cabezas vendidas no coinciden con las compradas",
      },
      403: { description: "No sos admin/contable de la empresa activa" },
      404: { description: "No existe o no pertenece a la empresa activa" },
    },
  });
}
