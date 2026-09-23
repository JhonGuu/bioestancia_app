import { z } from "zod";

import { registry } from "@/shared/infra/openapi/registry";
import { apiResponseSchema, empresaIdHeaderSchema } from "@/shared/infra/openapi/common";
import { TransporteValidation } from "@/modules/transportes/infra/http/validation";
import { TipoVehiculo } from "@/modules/transportes/domain/vehiculo";

const validation = new TransporteValidation();

const transportistaSchema = z.object({
  id: z.string().uuid(),
  empresaId: z.string().uuid(),
  nombre: z.string(),
  cuit: z.string(),
  telefono: z.string().nullable(),
  esPropio: z.boolean(),
  activo: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const choferSchema = z.object({
  id: z.string().uuid(),
  empresaId: z.string().uuid(),
  transportistaId: z.string().uuid().nullable(),
  nombre: z.string(),
  apellido: z.string(),
  cuit: z.string(),
  dni: z.string().nullable().describe("Solo con el permiso ver_datos_choferes; sin él viene null"),
  telefono: z.string().nullable(),
  licenciaVencimiento: z
    .string()
    .nullable()
    .describe("AAAA-MM-DD. Solo con el permiso ver_datos_choferes; sin él viene null"),
  activo: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const vehiculoSchema = z.object({
  id: z.string().uuid(),
  empresaId: z.string().uuid(),
  transportistaId: z.string().uuid().nullable(),
  tipo: z.nativeEnum(TipoVehiculo),
  patente: z.string(),
  descripcion: z.string().nullable(),
  rtoVencimiento: z.string().nullable(),
  seguroVencimiento: z.string().nullable(),
  habilitacionAnimalesVencimiento: z.string().nullable(),
  activo: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const transporteClienteSchema = z.object({
  choferes: z.array(choferSchema),
  vehiculos: z.array(vehiculoSchema),
});

const idParams = z.object({ id: z.string().uuid() });

interface CrudDoc {
  path: string;
  tag: string;
  singular: string;
  plural: string;
  schema: z.ZodTypeAny;
  createBody: z.ZodTypeAny;
}

/** Registra los seis endpoints (alta, listado, detalle, edición, baja, reactivación) de una entidad. */
function registrarCrud({ path, tag, singular, plural, schema, createBody }: CrudDoc): void {
  registry.registerPath({
    method: "post",
    path,
    tags: [tag],
    summary: `Crea ${singular} en la empresa activa. Admin o contable.`,
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      body: { content: { "application/json": { schema: createBody } } },
    },
    responses: {
      201: { description: "Creado", content: { "application/json": { schema: apiResponseSchema(schema) } } },
      400: { description: "Datos inválidos" },
      403: { description: "No sos admin/contable de la empresa activa" },
      409: { description: "Ya existe uno con el mismo CUIT o patente en esta empresa" },
    },
  });

  registry.registerPath({
    method: "get",
    path,
    tags: [tag],
    summary: `Lista ${plural} de la empresa activa. \`estado\` filtra activos/inactivos/todos (default activos).`,
    security: [{ bearerAuth: [] }],
    request: { headers: empresaIdHeaderSchema, query: validation.list.query },
    responses: {
      200: { description: "OK", content: { "application/json": { schema: apiResponseSchema(z.array(schema)) } } },
    },
  });

  registry.registerPath({
    method: "get",
    path: `${path}/{id}`,
    tags: [tag],
    summary: `Obtiene ${singular} por id`,
    security: [{ bearerAuth: [] }],
    request: { headers: empresaIdHeaderSchema, params: idParams },
    responses: {
      200: { description: "OK", content: { "application/json": { schema: apiResponseSchema(schema) } } },
      404: { description: "No existe o no pertenece a la empresa activa" },
    },
  });

  registry.registerPath({
    method: "patch",
    path: `${path}/{id}`,
    tags: [tag],
    summary: `Edita ${singular} (reemplaza todos los campos, mismas reglas que el alta). Admin o contable.`,
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      params: idParams,
      body: { content: { "application/json": { schema: createBody } } },
    },
    responses: {
      200: { description: "Actualizado", content: { "application/json": { schema: apiResponseSchema(schema) } } },
      400: { description: "Datos inválidos" },
      403: { description: "No sos admin/contable de la empresa activa" },
      404: { description: "No existe o no pertenece a la empresa activa" },
      409: { description: "Ya existe otro con el mismo CUIT o patente en esta empresa" },
    },
  });

  registry.registerPath({
    method: "delete",
    path: `${path}/{id}`,
    tags: [tag],
    summary: `Da de baja (soft-delete) ${singular}: deja de listarse y se puede reactivar. Admin o contable.`,
    security: [{ bearerAuth: [] }],
    request: { headers: empresaIdHeaderSchema, params: idParams },
    responses: {
      200: { description: "Dado de baja" },
      403: { description: "No sos admin/contable de la empresa activa" },
      404: { description: "No existe o no pertenece a la empresa activa" },
    },
  });

  registry.registerPath({
    method: "post",
    path: `${path}/{id}/reactivar`,
    tags: [tag],
    summary: `Deshace la baja de ${singular}. Admin o contable.`,
    security: [{ bearerAuth: [] }],
    request: { headers: empresaIdHeaderSchema, params: idParams },
    responses: {
      200: { description: "Reactivado", content: { "application/json": { schema: apiResponseSchema(schema) } } },
      403: { description: "No sos admin/contable de la empresa activa" },
      404: { description: "No existe o no pertenece a la empresa activa" },
    },
  });
}

export function registerTransporteOpenApi(): void {
  registrarCrud({
    path: "/transportistas",
    tag: "Transporte",
    singular: "un transportista",
    plural: "los transportistas",
    schema: transportistaSchema,
    createBody: validation.transportista.create.body,
  });
  registrarCrud({
    path: "/choferes",
    tag: "Transporte",
    singular: "un chofer",
    plural: "los choferes",
    schema: choferSchema,
    createBody: validation.chofer.create.body,
  });
  registrarCrud({
    path: "/vehiculos",
    tag: "Transporte",
    singular: "un vehículo",
    plural: "los vehículos",
    schema: vehiculoSchema,
    createBody: validation.vehiculo.create.body,
  });

  registry.registerPath({
    method: "get",
    path: "/clientes/{id}/transporte",
    tags: ["Transporte"],
    summary: "Choferes y vehículos activos autorizados a retirar mercadería del cliente",
    security: [{ bearerAuth: [] }],
    request: { headers: empresaIdHeaderSchema, params: idParams },
    responses: {
      200: {
        description: "OK",
        content: { "application/json": { schema: apiResponseSchema(transporteClienteSchema) } },
      },
      404: { description: "El cliente no existe o no pertenece a la empresa activa" },
    },
  });

  registry.registerPath({
    method: "put",
    path: "/clientes/{id}/transporte",
    tags: ["Transporte"],
    summary:
      "Reemplaza las listas de choferes y vehículos autorizados del cliente (todo o nada). Admin o contable.",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      params: idParams,
      body: { content: { "application/json": { schema: validation.transporteCliente.set.body } } },
    },
    responses: {
      200: {
        description: "Listas actualizadas",
        content: { "application/json": { schema: apiResponseSchema(transporteClienteSchema) } },
      },
      400: { description: "Algún chofer o vehículo no existe en esta empresa" },
      403: { description: "No sos admin/contable de la empresa activa" },
      404: { description: "El cliente no existe o no pertenece a la empresa activa" },
    },
  });
}
