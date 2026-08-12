import { z } from "zod";

import { registry } from "@/shared/infra/openapi/registry";
import { apiResponseSchema, empresaIdHeaderSchema } from "@/shared/infra/openapi/common";
import { CargoCuentaCorrienteValidation } from "@/modules/cargos-cuenta-corriente/infra/http/validation";
import { TipoCargo } from "@/modules/cargos-cuenta-corriente/domain/tipo-cargo";

const validation = new CargoCuentaCorrienteValidation();

const cargoSchema = z.object({
  id: z.string().uuid(),
  empresaId: z.string().uuid(),
  clienteId: z.string().uuid(),
  tipo: z.nativeEnum(TipoCargo),
  monto: z.number(),
  chequeId: z.string().uuid().nullable(),
  motivo: z.string().nullable(),
  fecha: z.string().datetime(),
  activo: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export function registerCargosCuentaCorrienteOpenApi(): void {
  registry.registerPath({
    method: "post",
    path: "/cargos-cuenta-corriente",
    tags: ["Cargos cuenta corriente"],
    summary: "Carga un cargo manual (ajuste puntual) en la cuenta corriente de un cliente. Admin o contable.",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      body: { content: { "application/json": { schema: validation.create.body } } },
    },
    responses: {
      201: {
        description: "Cargo creado",
        content: { "application/json": { schema: apiResponseSchema(cargoSchema) } },
      },
      400: { description: "Datos inválidos" },
      403: { description: "No sos admin/contable de la empresa activa" },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/cargos-cuenta-corriente",
    tags: ["Cargos cuenta corriente"],
    summary: "Lista los cargos de la empresa activa, filtrable por cliente. Admin o contable.",
    security: [{ bearerAuth: [] }],
    request: { headers: empresaIdHeaderSchema, query: validation.list.query },
    responses: {
      200: {
        description: "OK",
        content: { "application/json": { schema: apiResponseSchema(z.array(cargoSchema)) } },
      },
      403: { description: "No sos admin/contable de la empresa activa" },
    },
  });
}
