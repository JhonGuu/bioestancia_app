import { z } from "zod";

import { registry } from "@/shared/infra/openapi/registry";
import { apiResponseSchema, empresaIdHeaderSchema } from "@/shared/infra/openapi/common";
import { CompraValidation } from "@/modules/compras/infra/http/validation";
import { EspecieAnimal } from "@/modules/compras/domain/especie-animal";
import { CategoriaPorcino } from "@/modules/compras/domain/categoria-porcino";
import { RazaPorcino } from "@/modules/compras/domain/raza-porcino";

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
  precioCompraKg: z.number().nullable(),
  porcentajeDesbaste: z.number(),
  pesoBruto: z.number(),
  pesoNeto: z.number(),
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
  categoria: z.nativeEnum(CategoriaPorcino),
  raza: z.nativeEnum(RazaPorcino).nullable(),
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
      "\"30 machos + 90 hembras\"), por eso `categorias` es un array con al menos una línea, " +
      "pero el peso (`pesoBruto`) se carga una sola vez para toda la tropa (se pesa entera en " +
      "la báscula, sin discriminar por categoría) — el desglose de peso por categoría se hace " +
      "después, al armar la liquidación de compra. `pesoNeto` se calcula en el server " +
      "(pesoBruto × (1 - porcentajeDesbaste/100)). Si no se manda porcentajeDesbaste, se usa " +
      "el del proveedor. Admin o contable.",
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

  const stockTropaSchema = compraSchema.extend({
    cabezasCompradas: z.number().int(),
    cabezasVendidas: z.number().int(),
    stockRestante: z.number().int(),
    categorias: z.array(
      z.object({ categoria: z.nativeEnum(CategoriaPorcino), cabezas: z.number().int() }),
    ),
  });

  registry.registerPath({
    method: "get",
    path: "/compras/stock",
    tags: ["Compras"],
    summary:
      "Stock teórico de cada tropa ABIERTA (no cerrada) de la empresa activa: cabezas compradas " +
      "menos cabezas ya vendidas (garrones distintos, sin contar compensación de kg) — mismo " +
      "criterio de reconciliación que /compras/{id}/cerrar. No incluye conteo real del operario.",
    security: [{ bearerAuth: [] }],
    request: { headers: empresaIdHeaderSchema },
    responses: {
      200: {
        description: "OK",
        content: { "application/json": { schema: apiResponseSchema(z.array(stockTropaSchema)) } },
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
    method: "patch",
    path: "/compras/{id}",
    tags: ["Compras"],
    summary:
      "Edita una compra completa: proveedor, especie, datos generales (número, letra, fecha, " +
      "DTE, remito, porcentajeDesbaste, pesoBruto, comentarios) y, si se manda `categorias`, " +
      "sincroniza el detalle completo (las líneas con `id` se actualizan, las que no vienen se " +
      "borran, las que no traen `id` se crean). Si cambia pesoBruto o porcentajeDesbaste, " +
      "pesoNeto se recalcula en el server. Rechazado si la compra ya está cerrada (reabrila " +
      "primero con /compras/{id}/reabrir). Admin o contable.",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      params: z.object({ id: z.string().uuid() }),
      body: { content: { "application/json": { schema: validation.update.body } } },
    },
    responses: {
      200: {
        description: "Compra actualizada, con sus categorías",
        content: { "application/json": { schema: apiResponseSchema(compraConCategoriasSchema) } },
      },
      400: { description: "La compra ya está cerrada" },
      403: { description: "No sos admin/contable de la empresa activa" },
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

  registry.registerPath({
    method: "post",
    path: "/compras/{id}/reabrir",
    tags: ["Compras"],
    summary:
      "Deshace el cierre de una compra: vuelve a cerrada=false y limpia fechaCierre/" +
      "pesoFinalVenta/rinde, para corregir algo y volver a cerrar después. Admin o contable.",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "Compra reabierta",
        content: { "application/json": { schema: apiResponseSchema(compraSchema) } },
      },
      400: { description: "La compra no está cerrada" },
      403: { description: "No sos admin/contable de la empresa activa" },
      404: { description: "No existe o no pertenece a la empresa activa" },
    },
  });
}
