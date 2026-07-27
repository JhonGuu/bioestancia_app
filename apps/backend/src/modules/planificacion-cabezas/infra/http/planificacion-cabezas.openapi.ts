import { z } from "zod";

import { registry } from "@/shared/infra/openapi/registry";
import { apiResponseSchema, empresaIdHeaderSchema } from "@/shared/infra/openapi/common";
import { PlanificacionCabezasValidation } from "@/modules/planificacion-cabezas/infra/http/validation";

const validation = new PlanificacionCabezasValidation();

const planificacionCabezasSchema = z.object({
  id: z.string().uuid(),
  empresaId: z.string().uuid(),
  clienteId: z.string().uuid(),
  fecha: z.string().datetime(),
  cabezasPlanificadas: z.number().int(),
  comentarios: z.string().nullable(),
  activo: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const planificacionCabezasConVentasSchema = planificacionCabezasSchema.extend({
  cabezasVendidas: z.number().int(),
});

export function registerPlanificacionCabezasOpenApi(): void {
  registry.registerPath({
    method: "post",
    path: "/planificacion-cabezas",
    tags: ["Planificación de cabezas"],
    summary:
      "Guarda o revisa el plan de cabezas de un cliente para uno o varios días (upsert por " +
      "cliente+fecha — recargar el mismo día actualiza el plan existente). Es independiente de " +
      "las compras: no reserva animales de ninguna tropa puntual. Admin o contable.",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      body: { content: { "application/json": { schema: validation.upsert.body } } },
    },
    responses: {
      201: {
        description: "Días guardados",
        content: { "application/json": { schema: apiResponseSchema(z.array(planificacionCabezasSchema)) } },
      },
      403: { description: "No sos admin/contable de la empresa activa" },
      404: { description: "El clienteId no existe en la empresa activa" },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/planificacion-cabezas",
    tags: ["Planificación de cabezas"],
    summary:
      "Lista el plan de cabezas en un rango de fechas (un cliente puntual, o todos si no se " +
      "manda clienteId), cruzado contra lo efectivamente vendido (cabezasVendidas = garrones " +
      "distintos vendidos ese día a ese cliente).",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      query: validation.list.query,
    },
    responses: {
      200: {
        description: "OK",
        content: {
          "application/json": {
            schema: apiResponseSchema(z.array(planificacionCabezasConVentasSchema)),
          },
        },
      },
    },
  });
}
