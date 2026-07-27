import { z } from "zod";

import { registry } from "@/shared/infra/openapi/registry";
import { apiResponseSchema, empresaIdHeaderSchema } from "@/shared/infra/openapi/common";
import { ListaDePreciosValidation } from "@/modules/listas-precios/infra/http/validation";

const validation = new ListaDePreciosValidation();

const listaDePreciosSchema = z.object({
  id: z.string().uuid(),
  empresaId: z.string().uuid(),
  nombre: z.string(),
  descripcion: z.string().nullable(),
  activa: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export function registerListasDePreciosOpenApi(): void {
  registry.registerPath({
    method: "post",
    path: "/listas-precios",
    tags: ["Listas de precios"],
    summary: "Crea una lista de precios para la empresa activa. Admin o contable.",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      body: { content: { "application/json": { schema: validation.create.body } } },
    },
    responses: {
      201: {
        description: "Lista de precios creada",
        content: { "application/json": { schema: apiResponseSchema(listaDePreciosSchema) } },
      },
      403: { description: "No sos admin/contable de la empresa activa" },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/listas-precios",
    tags: ["Listas de precios"],
    summary: "Lista las listas de precios activas de la empresa activa",
    security: [{ bearerAuth: [] }],
    request: { headers: empresaIdHeaderSchema },
    responses: {
      200: {
        description: "OK",
        content: { "application/json": { schema: apiResponseSchema(z.array(listaDePreciosSchema)) } },
      },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/listas-precios/{id}",
    tags: ["Listas de precios"],
    summary: "Obtiene una lista de precios de la empresa activa por id",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "OK",
        content: { "application/json": { schema: apiResponseSchema(listaDePreciosSchema) } },
      },
      404: { description: "No existe o no pertenece a la empresa activa" },
    },
  });
}
