import { z } from "zod";

import { registry } from "@/shared/infra/openapi/registry";
import { apiResponseSchema, empresaIdHeaderSchema } from "@/shared/infra/openapi/common";
import { ChequeValidation } from "@/modules/cheques/infra/http/validation";
import { EstadoCheque } from "@/modules/cheques/domain/estado-cheque";

const validation = new ChequeValidation();

const chequeSchema = z.object({
  id: z.string().uuid(),
  empresaId: z.string().uuid(),
  clienteId: z.string().uuid(),
  numero: z.string(),
  banco: z.string(),
  cuitLibrador: z.string().nullable(),
  titular: z.string().nullable(),
  fechaEmision: z.string().datetime(),
  fechaPago: z.string().datetime(),
  monto: z.number(),
  estado: z.nativeEnum(EstadoCheque),
  fechaUltimoCambioEstado: z.string().datetime(),
  motivoRechazo: z.string().nullable(),
  comentarios: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export function registerChequesOpenApi(): void {
  registry.registerPath({
    method: "get",
    path: "/cheques",
    tags: ["Cheques"],
    summary: "Lista la cartera de cheques de la empresa activa, filtrable por estado y/o cliente. Admin o contable.",
    security: [{ bearerAuth: [] }],
    request: { headers: empresaIdHeaderSchema, query: validation.list.query },
    responses: {
      200: {
        description: "OK",
        content: { "application/json": { schema: apiResponseSchema(z.array(chequeSchema)) } },
      },
      403: { description: "No sos admin/contable de la empresa activa" },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/cheques/{id}",
    tags: ["Cheques"],
    summary: "Obtiene un cheque por id. Admin o contable.",
    security: [{ bearerAuth: [] }],
    request: { headers: empresaIdHeaderSchema, params: z.object({ id: z.string().uuid() }) },
    responses: {
      200: {
        description: "OK",
        content: { "application/json": { schema: apiResponseSchema(chequeSchema) } },
      },
      403: { description: "No sos admin/contable de la empresa activa" },
      404: { description: "No existe o no pertenece a la empresa activa" },
    },
  });

  registry.registerPath({
    method: "patch",
    path: "/cheques/{id}/estado",
    tags: ["Cheques"],
    summary:
      "Cambia el estado de un cheque (en cartera, depositado, acreditado, rechazado, endosado a terceros). Exige motivoRechazo si el estado es RECHAZADO. Admin o contable.",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      params: z.object({ id: z.string().uuid() }),
      body: { content: { "application/json": { schema: validation.actualizarEstado.body } } },
    },
    responses: {
      200: {
        description: "Estado actualizado",
        content: { "application/json": { schema: apiResponseSchema(chequeSchema) } },
      },
      400: { description: "Falta el motivo de rechazo" },
      403: { description: "No sos admin/contable de la empresa activa" },
      404: { description: "No existe o no pertenece a la empresa activa" },
    },
  });
}
