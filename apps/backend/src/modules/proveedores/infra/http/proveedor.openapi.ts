import { z } from "zod";

import { registry } from "@/shared/infra/openapi/registry";
import { apiResponseSchema, empresaIdHeaderSchema } from "@/shared/infra/openapi/common";
import { ProveedorValidation } from "@/modules/proveedores/infra/http/validation";
import { CondicionFiscal } from "@/modules/clientes/domain/condicion-fiscal";
import { CodigoAfipPorcino } from "@/modules/proveedores/domain/codigo-afip-porcino";

const validation = new ProveedorValidation();

const proveedorSchema = z.object({
  id: z.string().uuid(),
  empresaId: z.string().uuid(),
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
  datosBancarios: z.string().nullable(),
  porcentajeDesbaste: z.number().nullable(),
  renspa: z.string().nullable(),
  codigoAfip: z.nativeEnum(CodigoAfipPorcino).nullable(),
  activo: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export function registerProveedoresOpenApi(): void {
  registry.registerPath({
    method: "post",
    path: "/proveedores",
    tags: ["Proveedores"],
    summary:
      "Crea un proveedor para la empresa activa. Persona física (nombre+apellido+dni) o jurídica (razonSocial+cuit). Admin o contable.",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      body: { content: { "application/json": { schema: validation.create.body } } },
    },
    responses: {
      201: {
        description: "Proveedor creado",
        content: { "application/json": { schema: apiResponseSchema(proveedorSchema) } },
      },
      400: {
        description:
          "Falta nombre+apellido/razonSocial, falta cuit/dni, o el CBU/CVU no tiene 22 dígitos",
      },
      403: { description: "No sos admin/contable de la empresa activa" },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/proveedores",
    tags: ["Proveedores"],
    summary: "Lista los proveedores de la empresa activa",
    security: [{ bearerAuth: [] }],
    request: { headers: empresaIdHeaderSchema },
    responses: {
      200: {
        description: "OK",
        content: { "application/json": { schema: apiResponseSchema(z.array(proveedorSchema)) } },
      },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/proveedores/{id}",
    tags: ["Proveedores"],
    summary: "Obtiene un proveedor de la empresa activa por id",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "OK",
        content: { "application/json": { schema: apiResponseSchema(proveedorSchema) } },
      },
      404: { description: "No existe o no pertenece a la empresa activa" },
    },
  });
}
