import { z } from "zod";

import { registry } from "@/shared/infra/openapi/registry";
import { apiResponseSchema, empresaIdHeaderSchema } from "@/shared/infra/openapi/common";
import { VentaValidation } from "@/modules/ventas/infra/http/validation";
import { FormaVenta } from "@/modules/ventas/domain/forma-venta";
import { CategoriaPorcino } from "@/modules/compras/domain/categoria-porcino";
import { CategoriaReventa } from "@/modules/ventas/domain/categoria-venta";

const validation = new VentaValidation();

const ventaSchema = z.object({
  id: z.string().uuid(),
  empresaId: z.string().uuid(),
  clienteId: z.string().uuid(),
  boletaId: z.string().uuid().nullable(),
  compraId: z.string().uuid().nullable(),
  garron: z.number().int().nullable(),
  formaVenta: z.nativeEnum(FormaVenta),
  categoria: z.union([z.nativeEnum(CategoriaPorcino), z.nativeEnum(CategoriaReventa)]).nullable(),
  kg: z.number(),
  precioKg: z.number().nullable(),
  total: z.number().nullable(),
  fecha: z.string().datetime(),
  clienteFinalId: z.string().uuid().nullable(),
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
      "Crea una venta (una cabeza, media res, corte, o un ajuste de compensación de kg) para la " +
      "empresa activa. precioKg es opcional — sin él, la venta queda pendiente de precio (ver " +
      "PATCH /ventas/{id}/precio). El total se calcula en el server (kg × precioKg), no se recibe " +
      "del cliente. Admin o contable.",
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

  registry.registerPath({
    method: "patch",
    path: "/ventas/{id}/precio",
    tags: ["Ventas"],
    summary:
      "Completa (o corrige) el precio de una venta cargada sin él (flujo del operario vía boletas). " +
      "Recalcula el total. Admin o contable.",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      params: z.object({ id: z.string().uuid() }),
      body: { content: { "application/json": { schema: validation.setPrecio.body } } },
    },
    responses: {
      200: {
        description: "Precio cargado",
        content: { "application/json": { schema: apiResponseSchema(ventaSchema) } },
      },
      403: { description: "No sos admin/contable de la empresa activa" },
      404: { description: "No existe o no pertenece a la empresa activa" },
    },
  });

  registry.registerPath({
    method: "patch",
    path: "/ventas/precio-lote",
    tags: ["Ventas"],
    summary:
      "Aplica el mismo precio por kg a varias ventas de una vez (ej. todas las de una " +
      "categoría/presentación dentro de una boleta) — evita cargar precio venta por venta. Admin o contable.",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      body: { content: { "application/json": { schema: validation.setPrecioLote.body } } },
    },
    responses: {
      200: {
        description: "Precio cargado en todas las ventas del lote",
        content: { "application/json": { schema: apiResponseSchema(z.array(ventaSchema)) } },
      },
      403: { description: "No sos admin/contable de la empresa activa" },
      404: { description: "Alguna de las ventas no existe (o no es de esta empresa)" },
    },
  });

  registry.registerPath({
    method: "patch",
    path: "/ventas/{id}",
    tags: ["Ventas"],
    summary:
      "Corrige garrón/kg/categoría/comentarios de una línea ya cargada — para arreglar una carga mal " +
      "hecha. No toca precioKg (ver PATCH /ventas/{id}/precio). Si la venta ya tenía precio y cambia kg, " +
      "recalcula el total, y si pertenece a una boleta con cobros ya aplicados, re-ajusta el exceso. " +
      "Admin, contable u operario.",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      params: z.object({ id: z.string().uuid() }),
      body: { content: { "application/json": { schema: validation.updateItem.body } } },
    },
    responses: {
      200: {
        description: "Venta actualizada",
        content: { "application/json": { schema: apiResponseSchema(ventaSchema) } },
      },
      403: { description: "No tenés acceso a la empresa activa" },
      404: { description: "No existe o no pertenece a la empresa activa" },
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/ventas/{id}",
    tags: ["Ventas"],
    summary:
      "Borra (soft-delete) una línea de venta — si pertenece a una boleta con cobros ya aplicados, " +
      "re-ajusta el exceso (queda como saldo a favor del cliente). Admin, contable u operario.",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: { description: "Venta eliminada" },
      403: { description: "No tenés acceso a la empresa activa" },
      404: { description: "No existe o no pertenece a la empresa activa" },
    },
  });
}
