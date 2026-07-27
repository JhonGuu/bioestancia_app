import { z } from "zod";

import { registry } from "@/shared/infra/openapi/registry";
import { apiResponseSchema, empresaIdHeaderSchema } from "@/shared/infra/openapi/common";
import { ClienteValidation } from "@/modules/clientes/infra/http/validation";
import { CondicionFiscal } from "@/modules/clientes/domain/condicion-fiscal";

const validation = new ClienteValidation();

const clienteSchema = z.object({
  id: z.string().uuid(),
  empresaId: z.string().uuid(),
  listaDePreciosId: z.string().uuid().nullable(),
  nombre: z.string().nullable(),
  apellido: z.string().nullable(),
  razonSocial: z.string().nullable(),
  cuit: z.string().nullable(),
  dni: z.string().nullable(),
  domicilio: z.string().nullable(),
  email: z.string().nullable(),
  pais: z.string().nullable(),
  provincia: z.string().nullable(),
  ubicacion: z.string().nullable(),
  condicionFiscal: z.nativeEnum(CondicionFiscal),
  activo: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export function registerClientesOpenApi(): void {
  registry.registerPath({
    method: "post",
    path: "/clientes",
    tags: ["Clientes"],
    summary:
      "Crea un cliente para la empresa activa. Persona física (nombre+apellido+dni) o jurídica (razonSocial+cuit). Admin o contable.",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      body: { content: { "application/json": { schema: validation.create.body } } },
    },
    responses: {
      201: {
        description: "Cliente creado",
        content: { "application/json": { schema: apiResponseSchema(clienteSchema) } },
      },
      400: { description: "Falta nombre+apellido/razonSocial, o falta cuit/dni" },
      403: { description: "No sos admin/contable de la empresa activa" },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/clientes",
    tags: ["Clientes"],
    summary: "Lista los clientes de la empresa activa",
    security: [{ bearerAuth: [] }],
    request: { headers: empresaIdHeaderSchema },
    responses: {
      200: {
        description: "OK",
        content: { "application/json": { schema: apiResponseSchema(z.array(clienteSchema)) } },
      },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/clientes/{id}",
    tags: ["Clientes"],
    summary: "Obtiene un cliente de la empresa activa por id",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "OK",
        content: { "application/json": { schema: apiResponseSchema(clienteSchema) } },
      },
      404: { description: "No existe o no pertenece a la empresa activa" },
    },
  });
}
