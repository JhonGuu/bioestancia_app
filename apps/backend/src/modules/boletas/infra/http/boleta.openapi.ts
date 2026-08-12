import { z } from "zod";

import { registry } from "@/shared/infra/openapi/registry";
import { apiResponseSchema, empresaIdHeaderSchema } from "@/shared/infra/openapi/common";
import { BoletaValidation } from "@/modules/boletas/infra/http/validation";
import { FormaVenta } from "@/modules/ventas/domain/forma-venta";
import { CategoriaPorcino } from "@/modules/compras/domain/categoria-porcino";
import { CategoriaReventa } from "@/modules/ventas/domain/categoria-venta";

const validation = new BoletaValidation();

const boletaSchema = z.object({
  id: z.string().uuid(),
  empresaId: z.string().uuid(),
  clienteId: z.string().uuid(),
  fecha: z.string().datetime(),
  fechaVencimiento: z.string().datetime().nullable(),
  numero: z.string().nullable(),
  comentarios: z.string().nullable(),
  activo: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const ventaDeBoletaSchema = z.object({
  id: z.string().uuid(),
  compraId: z.string().uuid().nullable(),
  garron: z.number().int().nullable(),
  formaVenta: z.nativeEnum(FormaVenta),
  categoria: z.union([z.nativeEnum(CategoriaPorcino), z.nativeEnum(CategoriaReventa)]).nullable(),
  kg: z.number(),
  precioKg: z.number().nullable(),
  total: z.number().nullable(),
});

const boletaConVentasSchema = boletaSchema.extend({ ventas: z.array(ventaDeBoletaSchema) });

export function registerBoletasOpenApi(): void {
  registry.registerPath({
    method: "post",
    path: "/boletas",
    tags: ["Boletas"],
    summary:
      "Crea una boleta (comprobante de un cliente para un día) para la empresa activa, con sus " +
      "ítems opcionales (garrones/medias reses/cortes) — los crea como ventas SIN precio, " +
      "pendientes de que admin/contable las complete con PATCH /ventas/{id}/precio. " +
      "Admin, contable, u operario.",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      body: { content: { "application/json": { schema: validation.create.body } } },
    },
    responses: {
      201: {
        description: "Boleta (con sus ventas, si mandaste items) creada",
        content: { "application/json": { schema: apiResponseSchema(boletaConVentasSchema) } },
      },
      400: { description: "Algún ítem referencia una compra inexistente, o le falta garrón/categoría" },
      403: { description: "No sos admin/contable/operario de la empresa activa" },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/boletas",
    tags: ["Boletas"],
    summary: "Lista las boletas de la empresa activa (sin sus ítems — ver GET /boletas/{id})",
    security: [{ bearerAuth: [] }],
    request: { headers: empresaIdHeaderSchema },
    responses: {
      200: {
        description: "OK",
        content: { "application/json": { schema: apiResponseSchema(z.array(boletaSchema)) } },
      },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/boletas/{id}",
    tags: ["Boletas"],
    summary: "Obtiene una boleta de la empresa activa por id, con sus ítems (ventas)",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "OK",
        content: { "application/json": { schema: apiResponseSchema(boletaConVentasSchema) } },
      },
      404: { description: "No existe o no pertenece a la empresa activa" },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/boletas/reporte-diario/pdf",
    tags: ["Boletas"],
    summary:
      "Genera un PDF con todas las boletas de la empresa activa en un día, agrupadas por cliente " +
      "con el detalle completo de cada ítem y subtotales/total general.",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      query: validation.reporteDiario.query,
    },
    responses: {
      200: {
        description: "PDF del reporte diario",
        content: { "application/pdf": { schema: z.string().openapi({ format: "binary" }) } },
      },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/boletas/reporte-diario/excel",
    tags: ["Boletas"],
    summary: "Igual que /boletas/reporte-diario/pdf, pero exportado como planilla Excel (.xlsx).",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      query: validation.reporteDiario.query,
    },
    responses: {
      200: {
        description: "Excel (.xlsx) del reporte diario",
        content: {
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
            schema: z.string().openapi({ format: "binary" }),
          },
        },
      },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/boletas/{id}/pdf",
    tags: ["Boletas"],
    summary:
      "Genera el PDF de una boleta puntual, con un diseño similar al formulario de papel físico " +
      "usado por El Meridiano — pensado para mandárselo al cliente.",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "PDF de la boleta",
        content: { "application/pdf": { schema: z.string().openapi({ format: "binary" }) } },
      },
      404: { description: "No existe o no pertenece a la empresa activa" },
    },
  });
}
