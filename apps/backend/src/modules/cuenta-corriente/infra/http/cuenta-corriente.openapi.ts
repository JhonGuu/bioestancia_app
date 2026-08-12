import { z } from "zod";

import { registry } from "@/shared/infra/openapi/registry";
import { apiResponseSchema, empresaIdHeaderSchema } from "@/shared/infra/openapi/common";
import { CuentaCorrienteValidation } from "@/modules/cuenta-corriente/infra/http/validation";
import { TipoMovimientoCuentaCorriente } from "@/modules/cuenta-corriente/domain/movimiento-cuenta-corriente";

const validation = new CuentaCorrienteValidation();

const saldoClienteSchema = z.object({
  clienteId: z.string().uuid(),
  saldoVencido: z.number(),
  saldoPorVencer: z.number(),
  saldoTotal: z.number(),
  saldoAFavor: z.number(),
});

const movimientoSchema = z.object({
  tipo: z.nativeEnum(TipoMovimientoCuentaCorriente),
  fecha: z.string().datetime(),
  boletaId: z.string().uuid().nullable(),
  cobroId: z.string().uuid().nullable(),
  cargoId: z.string().uuid().nullable(),
  monto: z.number(),
  saldoPendiente: z.number().nullable(),
  fechaVencimiento: z.string().datetime().nullable(),
  saldoCorriente: z.number(),
});

export function registerCuentaCorrienteOpenApi(): void {
  registry.registerPath({
    method: "get",
    path: "/cuenta-corriente/{clienteId}/saldo",
    tags: ["Cuenta corriente"],
    summary:
      "Saldo de cuenta corriente de un cliente: vencido, por vencer, total, y a favor. " +
      "Calculado al vuelo (no es una tabla propia). Admin o contable.",
    security: [{ bearerAuth: [] }],
    request: { headers: empresaIdHeaderSchema, params: z.object({ clienteId: z.string().uuid() }) },
    responses: {
      200: {
        description: "OK",
        content: { "application/json": { schema: apiResponseSchema(saldoClienteSchema) } },
      },
      400: { description: "El cliente no existe (o no es de esta empresa)" },
      403: { description: "No sos admin/contable de la empresa activa" },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/cuenta-corriente/{clienteId}/movimientos",
    tags: ["Cuenta corriente"],
    summary:
      "Línea de tiempo de boletas, cobros, y cargos (recargo/comisión) de un cliente, con saldo corriente " +
      "después de cada movimiento, más reciente primero. Admin o contable.",
    security: [{ bearerAuth: [] }],
    request: { headers: empresaIdHeaderSchema, params: z.object({ clienteId: z.string().uuid() }) },
    responses: {
      200: {
        description: "OK",
        content: { "application/json": { schema: apiResponseSchema(z.array(movimientoSchema)) } },
      },
      400: { description: "El cliente no existe (o no es de esta empresa)" },
      403: { description: "No sos admin/contable de la empresa activa" },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/cuenta-corriente/{clienteId}/resumen/pdf",
    tags: ["Cuenta corriente"],
    summary:
      "Genera el PDF del resumen de cuenta de un cliente (saldo + línea de tiempo completa de " +
      "boletas, cobros y cargos) — pensado para mandárselo. Admin o contable.",
    security: [{ bearerAuth: [] }],
    request: { headers: empresaIdHeaderSchema, params: z.object({ clienteId: z.string().uuid() }) },
    responses: {
      200: {
        description: "PDF del resumen de cuenta",
        content: { "application/pdf": { schema: z.string().openapi({ format: "binary" }) } },
      },
      400: { description: "El cliente no existe (o no es de esta empresa)" },
      403: { description: "No sos admin/contable de la empresa activa" },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/cuenta-corriente/{clienteId}/resumen/excel",
    tags: ["Cuenta corriente"],
    summary: "Igual que /cuenta-corriente/{clienteId}/resumen/pdf, pero exportado como planilla Excel (.xlsx).",
    security: [{ bearerAuth: [] }],
    request: { headers: empresaIdHeaderSchema, params: z.object({ clienteId: z.string().uuid() }) },
    responses: {
      200: {
        description: "Excel (.xlsx) del resumen de cuenta",
        content: {
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
            schema: z.string().openapi({ format: "binary" }),
          },
        },
      },
      400: { description: "El cliente no existe (o no es de esta empresa)" },
      403: { description: "No sos admin/contable de la empresa activa" },
    },
  });
}
