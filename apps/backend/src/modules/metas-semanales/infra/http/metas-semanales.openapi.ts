import { z } from "zod";

import { registry } from "@/shared/infra/openapi/registry";
import { apiResponseSchema, empresaIdHeaderSchema } from "@/shared/infra/openapi/common";

const progresoMetaSemanalSchema = z.object({
  clienteId: z.string().uuid(),
  anio: z.number(),
  semana: z.number(),
  fechaDesde: z.string().datetime(),
  fechaHasta: z.string().datetime(),
  metaCabezasSemanales: z.number(),
  cabezasCompradas: z.number(),
  cumplida: z.boolean(),
});

export function registerMetasSemanalesOpenApi(): void {
  registry.registerPath({
    method: "get",
    path: "/metas-semanales/progreso",
    tags: ["Metas semanales"],
    summary:
      "Progreso semanal (semana ISO 8601, lunes a domingo) de los clientes con meta de cabezas " +
      "configurada — no se compensa entre semanas. `fecha` (opcional, YYYY-MM-DD) elige qué semana " +
      "consultar; sin ella, la semana actual. Admin o contable.",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      query: z.object({ fecha: z.string().optional() }),
    },
    responses: {
      200: {
        description: "OK",
        content: { "application/json": { schema: apiResponseSchema(z.array(progresoMetaSemanalSchema)) } },
      },
      403: { description: "No sos admin/contable de la empresa activa" },
    },
  });
}
