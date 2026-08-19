import { z } from "zod";

import { registry } from "@/shared/infra/openapi/registry";
import { apiResponseSchema, empresaIdHeaderSchema } from "@/shared/infra/openapi/common";
import { BandaCobranza } from "@/modules/porcentaje-cobranza/domain/banda-cobranza";

const semanaCobranzaSchema = z.object({
  anio: z.number(),
  semana: z.number(),
  fechaDesde: z.string().datetime(),
  fechaHasta: z.string().datetime(),
  vendido: z.number(),
  cobrado: z.number(),
  saldoInicio: z.number(),
  porcentaje: z.number().nullable(),
  banda: z.nativeEnum(BandaCobranza).nullable(),
  remanente: z.number(),
});

const porcentajeCobranzaClienteSchema = z.object({
  clienteId: z.string().uuid(),
  semanas: z.array(semanaCobranzaSchema),
});

export function registerPorcentajeCobranzaOpenApi(): void {
  registry.registerPath({
    method: "get",
    path: "/porcentaje-cobranza",
    tags: ["Porcentaje de cobranza"],
    summary:
      "% de cobranza de deuda vencida por cliente, semana a semana (ISO 8601, lunes a domingo) de un " +
      "año — sin contar la venta nueva de esa semana. `anio` obligatorio. Admin o contable.",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      query: z.object({ anio: z.coerce.number() }),
    },
    responses: {
      200: {
        description: "OK",
        content: { "application/json": { schema: apiResponseSchema(z.array(porcentajeCobranzaClienteSchema)) } },
      },
      403: { description: "No sos admin/contable de la empresa activa" },
    },
  });
}
