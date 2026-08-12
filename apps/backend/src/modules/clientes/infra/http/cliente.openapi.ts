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
  esRevendedor: z.boolean(),
  diasPlazoPago: z.number().nullable(),
  activo: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const clienteFinalSchema = z.object({
  id: z.string().uuid(),
  empresaId: z.string().uuid(),
  clienteId: z.string().uuid(),
  nombre: z.string(),
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

  registry.registerPath({
    method: "patch",
    path: "/clientes/{id}",
    tags: ["Clientes"],
    summary:
      "Edita un cliente (reemplaza todos los campos, misma regla de negocio que el alta). Admin o contable.",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      params: z.object({ id: z.string().uuid() }),
      body: { content: { "application/json": { schema: validation.update.body } } },
    },
    responses: {
      200: {
        description: "Cliente actualizado",
        content: { "application/json": { schema: apiResponseSchema(clienteSchema) } },
      },
      400: { description: "Falta nombre+apellido/razonSocial, o falta cuit/dni" },
      403: { description: "No sos admin/contable de la empresa activa" },
      404: { description: "No existe o no pertenece a la empresa activa" },
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/clientes/{id}",
    tags: ["Clientes"],
    summary:
      "Elimina un cliente (soft-delete: no borra la fila, así no rompe ventas/boletas históricas). Admin o contable.",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: { description: "Cliente eliminado" },
      403: { description: "No sos admin/contable de la empresa activa" },
      404: { description: "No existe o no pertenece a la empresa activa" },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/clientes/{clienteId}/clientes-finales",
    tags: ["Clientes"],
    summary:
      "Crea un destino de reventa para un cliente revendedor (esRevendedor=true). Admin, contable, u operario.",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      params: z.object({ clienteId: z.string().uuid() }),
      body: { content: { "application/json": { schema: validation.createClienteFinal.body } } },
    },
    responses: {
      201: {
        description: "Destino creado",
        content: { "application/json": { schema: apiResponseSchema(clienteFinalSchema) } },
      },
      400: { description: "El cliente no existe, no es de esta empresa, o no es revendedor" },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/clientes/{clienteId}/clientes-finales",
    tags: ["Clientes"],
    summary: "Lista los destinos de reventa activos de un cliente revendedor",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      params: z.object({ clienteId: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "OK",
        content: { "application/json": { schema: apiResponseSchema(z.array(clienteFinalSchema)) } },
      },
    },
  });
}
