import { z } from "zod";

import { registry } from "@/shared/infra/openapi/registry";
import { apiResponseSchema, empresaIdHeaderSchema } from "@/shared/infra/openapi/common";
import { FrigorificoValidation } from "@/modules/frigorificos/infra/http/validation";

const validation = new FrigorificoValidation();

const frigorificoSchema = z.object({
  id: z.string().uuid(),
  empresaId: z.string().uuid(),
  nombre: z.string(),
  cuit: z.string().nullable(),
  senasaNumero: z.string().nullable(),
  rucaNumero: z.string().nullable(),
  activo: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export function registerFrigorificosOpenApi(): void {
  registry.registerPath({
    method: "post",
    path: "/frigorificos",
    tags: ["Frigoríficos"],
    summary: "Crea un frigorífico (planta faenadora) para la empresa activa. Admin o contable.",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      body: { content: { "application/json": { schema: validation.create.body } } },
    },
    responses: {
      201: {
        description: "Frigorífico creado",
        content: { "application/json": { schema: apiResponseSchema(frigorificoSchema) } },
      },
      400: { description: "Falta el nombre" },
      403: { description: "No sos admin/contable de la empresa activa" },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/frigorificos",
    tags: ["Frigoríficos"],
    summary:
      "Lista los frigoríficos de la empresa activa. `estado` filtra activos/inactivos/todos (default activos).",
    security: [{ bearerAuth: [] }],
    request: { headers: empresaIdHeaderSchema, query: validation.list.query },
    responses: {
      200: {
        description: "OK",
        content: { "application/json": { schema: apiResponseSchema(z.array(frigorificoSchema)) } },
      },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/frigorificos/{id}",
    tags: ["Frigoríficos"],
    summary: "Obtiene un frigorífico de la empresa activa por id",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "OK",
        content: { "application/json": { schema: apiResponseSchema(frigorificoSchema) } },
      },
      404: { description: "No existe o no pertenece a la empresa activa" },
    },
  });

  registry.registerPath({
    method: "patch",
    path: "/frigorificos/{id}",
    tags: ["Frigoríficos"],
    summary: "Edita un frigorífico (reemplaza todos los campos). Admin o contable.",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      params: z.object({ id: z.string().uuid() }),
      body: { content: { "application/json": { schema: validation.update.body } } },
    },
    responses: {
      200: {
        description: "Frigorífico actualizado",
        content: { "application/json": { schema: apiResponseSchema(frigorificoSchema) } },
      },
      400: { description: "Datos inválidos" },
      403: { description: "No sos admin/contable de la empresa activa" },
      404: { description: "No existe o no pertenece a la empresa activa" },
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/frigorificos/{id}",
    tags: ["Frigoríficos"],
    summary:
      "Elimina (soft-delete) un frigorífico — deja de listarse, pero los resultados de faena históricos no se tocan. Admin o contable.",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: { description: "Frigorífico eliminado" },
      403: { description: "No sos admin/contable de la empresa activa" },
      404: { description: "No existe o no pertenece a la empresa activa" },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/frigorificos/{id}/reactivar",
    tags: ["Frigoríficos"],
    summary: "Deshace el soft-delete de un frigorífico (vuelve a activo). Admin o contable.",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "Frigorífico reactivado",
        content: { "application/json": { schema: apiResponseSchema(frigorificoSchema) } },
      },
      403: { description: "No sos admin/contable de la empresa activa" },
      404: { description: "No existe o no pertenece a la empresa activa" },
    },
  });
}
