import { z } from "zod";

import { registry } from "@/shared/infra/openapi/registry";
import { apiResponseSchema, empresaIdHeaderSchema } from "@/shared/infra/openapi/common";
import { EmpresaValidation } from "@/modules/empresas/infra/http/validation";

const validation = new EmpresaValidation();

const empresaSchema = z.object({
  id: z.string().uuid(),
  razonSocial: z.string(),
  cuit: z.string().nullable(),
  telefono: z.string().nullable(),
  direccion: z.string().nullable(),
  rubro: z.enum(["frigorifico", "revendedora"]),
  activa: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * Registra en el OpenAPIRegistry compartido los endpoints de `empresas`.
 * Se llama una sola vez desde generate-document.ts, al armar la doc.
 */
export function registerEmpresasOpenApi(): void {
  registry.registerPath({
    method: "post",
    path: "/empresas",
    tags: ["Empresas (admin)"],
    summary: "Crea una empresa nueva. Uso administrativo/bootstrap — solo admin de la empresa activa.",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      body: { content: { "application/json": { schema: validation.create.body } } },
    },
    responses: {
      201: {
        description: "Empresa creada",
        content: { "application/json": { schema: apiResponseSchema(empresaSchema) } },
      },
      403: { description: "No sos admin de la empresa activa" },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/empresas",
    tags: ["Empresas (admin)"],
    summary: "Lista TODAS las empresas del sistema (no solo a las que tenés acceso). Solo admin.",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
    },
    responses: {
      200: {
        description: "OK",
        content: { "application/json": { schema: apiResponseSchema(z.array(empresaSchema)) } },
      },
      403: { description: "No sos admin de la empresa activa" },
    },
  });

  registry.registerPath({
    method: "patch",
    path: "/empresas/{id}",
    tags: ["Empresas (admin)"],
    summary:
      "Completa/edita cuit, teléfono y dirección de una empresa — se usan en el encabezado del PDF " +
      "de boleta. No permite tocar razonSocial/rubro. Solo admin.",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      params: z.object({ id: z.string().uuid() }),
      body: { content: { "application/json": { schema: validation.update.body } } },
    },
    responses: {
      200: {
        description: "Empresa actualizada",
        content: { "application/json": { schema: apiResponseSchema(empresaSchema) } },
      },
      403: { description: "No sos admin de la empresa activa" },
      404: { description: "No existe esa empresa" },
    },
  });
}
