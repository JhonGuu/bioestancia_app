import { z } from "zod";

import { registry } from "@/shared/infra/openapi/registry";
import { apiResponseSchema, empresaIdHeaderSchema } from "@/shared/infra/openapi/common";
import { InformeCobranzasValidation } from "@/modules/informe-cobranzas/infra/http/validation";
import { MedioPago } from "@/modules/cobros/domain/medio-pago";

const validation = new InformeCobranzasValidation();

const lineaInformeCobranzaSchema = z.object({
  cobroId: z.string().uuid(),
  fecha: z.string().datetime(),
  clienteId: z.string().uuid(),
  clienteNombre: z.string(),
  medioPago: z.nativeEnum(MedioPago),
  monto: z.number(),
  numeroCheque: z.string().nullable(),
  bancoCheque: z.string().nullable(),
  bancoOBilletera: z.string().nullable(),
  remitente: z.string().nullable(),
  comentarios: z.string().nullable(),
});

const totalPorMedioPagoSchema = z.object({
  medioPago: z.nativeEnum(MedioPago),
  cantidad: z.number(),
  total: z.number(),
});

const informeCobranzasSchema = z.object({
  desde: z.string().datetime().nullable(),
  hasta: z.string().datetime().nullable(),
  medioPagoFiltrado: z.nativeEnum(MedioPago).nullable(),
  lineas: z.array(lineaInformeCobranzaSchema),
  totalesPorMedioPago: z.array(totalPorMedioPagoSchema),
  totalGeneral: z.number(),
  generadoEn: z.string().datetime(),
});

export function registerInformeCobranzasOpenApi(): void {
  registry.registerPath({
    method: "get",
    path: "/informe-cobranzas",
    tags: ["Informe de cobranzas"],
    summary:
      "Todas las líneas de cobro (efectivo, transferencias, cheques) de TODOS los clientes de la empresa " +
      "activa, opcionalmente filtradas por rango de fecha y/o medio de pago, con totales por medio de pago " +
      "y total general — pensado para controlar que todo lo cobrado esté registrado. Admin o contable.",
    security: [{ bearerAuth: [] }],
    request: { headers: empresaIdHeaderSchema, query: validation.get.query },
    responses: {
      200: {
        description: "OK",
        content: { "application/json": { schema: apiResponseSchema(informeCobranzasSchema) } },
      },
      403: { description: "No sos admin/contable de la empresa activa" },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/informe-cobranzas/pdf",
    tags: ["Informe de cobranzas"],
    summary: "Igual que GET /informe-cobranzas, pero como PDF listo para imprimir/archivar.",
    security: [{ bearerAuth: [] }],
    request: { headers: empresaIdHeaderSchema, query: validation.pdf.query },
    responses: {
      200: {
        description: "PDF del informe de cobranzas",
        content: { "application/pdf": { schema: z.string().openapi({ format: "binary" }) } },
      },
      403: { description: "No sos admin/contable de la empresa activa" },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/informe-cobranzas/excel",
    tags: ["Informe de cobranzas"],
    summary: "Igual que GET /informe-cobranzas, pero exportado como planilla Excel (.xlsx).",
    security: [{ bearerAuth: [] }],
    request: { headers: empresaIdHeaderSchema, query: validation.excel.query },
    responses: {
      200: {
        description: "Excel (.xlsx) del informe de cobranzas",
        content: {
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
            schema: z.string().openapi({ format: "binary" }),
          },
        },
      },
      403: { description: "No sos admin/contable de la empresa activa" },
    },
  });
}
