import { z } from "zod";

import { registry } from "@/shared/infra/openapi/registry";
import { apiResponseSchema, empresaIdHeaderSchema } from "@/shared/infra/openapi/common";
import { BoletaValidation } from "@/modules/boletas/infra/http/validation";

const validation = new BoletaValidation();

const boletaSchema = z.object({
  id: z.string().uuid(),
  empresaId: z.string().uuid(),
  clienteId: z.string().uuid(),
  fecha: z.string().datetime(),
  numero: z.string().nullable(),
  comentarios: z.string().nullable(),
  activo: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export function registerBoletasOpenApi(): void {
  registry.registerPath({
    method: "post",
    path: "/boletas",
    tags: ["Boletas"],
    summary:
      "Crea una boleta (comprobante de un cliente para un día) para la empresa activa. " +
      "Las líneas de venta de esa boleta se cargan en /ventas con el boletaId. Admin o contable.",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      body: { content: { "application/json": { schema: validation.create.body } } },
    },
    responses: {
      201: {
        description: "Boleta creada",
        content: { "application/json": { schema: apiResponseSchema(boletaSchema) } },
      },
      403: { description: "No sos admin/contable de la empresa activa" },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/boletas",
    tags: ["Boletas"],
    summary: "Lista las boletas de la empresa activa",
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
    summary: "Obtiene una boleta de la empresa activa por id",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "OK",
        content: { "application/json": { schema: apiResponseSchema(boletaSchema) } },
      },
      404: { description: "No existe o no pertenece a la empresa activa" },
    },
  });
}
