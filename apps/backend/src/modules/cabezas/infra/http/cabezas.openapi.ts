import { z } from "zod";

import { registry } from "@/shared/infra/openapi/registry";
import { apiResponseSchema, empresaIdHeaderSchema } from "@/shared/infra/openapi/common";
import { CabezasValidation } from "@/modules/cabezas/infra/http/validation";

const validation = new CabezasValidation();

const lineaCabezasClienteSchema = z.object({
  clienteId: z.string().uuid(),
  clienteNombre: z.string(),
  cantEstimada: z.number(),
  cantReal: z.number(),
  kg: z.number(),
  montoTotal: z.number(),
  precioPromedio: z.number().nullable(),
});

const bloqueCabezasCategoriaSchema = z.object({
  grupo: z.enum(["CAPON", "CHANCHA"]),
  totalCabezas: z.number(),
  totalKg: z.number(),
  totalMonto: z.number(),
  precioPromedio: z.number().nullable(),
  precioMinimo: z.number().nullable(),
  lineas: z.array(lineaCabezasClienteSchema),
});

const informeCabezasSchema = z.object({
  anio: z.number(),
  semana: z.number(),
  desde: z.string().datetime(),
  hasta: z.string().datetime(),
  bloques: z.array(bloqueCabezasCategoriaSchema),
});

export function registerCabezasOpenApi(): void {
  registry.registerPath({
    method: "get",
    path: "/cabezas",
    tags: ["Cabezas"],
    summary:
      "Planificación vs. venta real de cabezas por cliente, de una semana ISO puntual (por defecto la semana " +
      "actual), separado en dos grupos: CAPON (todas las categorías porcinas salvo Chancha — el negocio las " +
      "trata igual) y CHANCHA (Cerda/Chancha, otro precio). Cant. estimada sale de planificación de cabezas " +
      "(no distingue grupo), cant. real/kg/$ salen de ventas cerradas de ese grupo/semana. Admin o contable.",
    security: [{ bearerAuth: [] }],
    request: { headers: empresaIdHeaderSchema, query: validation.get.query },
    responses: {
      200: {
        description: "OK",
        content: { "application/json": { schema: apiResponseSchema(informeCabezasSchema) } },
      },
      403: { description: "No sos admin/contable de la empresa activa" },
    },
  });
}
