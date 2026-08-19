import { z } from "zod";

import { registry } from "@/shared/infra/openapi/registry";
import { apiResponseSchema, empresaIdHeaderSchema } from "@/shared/infra/openapi/common";
import { CobroValidation } from "@/modules/cobros/infra/http/validation";
import { MedioPago } from "@/modules/cobros/domain/medio-pago";

const validation = new CobroValidation();

const lineaCobroSchema = z.object({
  id: z.string().uuid(),
  cobroId: z.string().uuid(),
  medioPago: z.nativeEnum(MedioPago),
  monto: z.number(),
  chequeId: z.string().uuid().nullable(),
  bancoOBilletera: z.string().nullable(),
  remitente: z.string().nullable(),
  createdAt: z.string().datetime(),
});

const cobroSchema = z.object({
  id: z.string().uuid(),
  empresaId: z.string().uuid(),
  clienteId: z.string().uuid(),
  fecha: z.string().datetime(),
  comentarios: z.string().nullable(),
  activo: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  lineas: z.array(lineaCobroSchema),
});

const cargoSchema = z.object({
  id: z.string().uuid(),
  empresaId: z.string().uuid(),
  clienteId: z.string().uuid(),
  tipo: z.string(),
  monto: z.number(),
  chequeId: z.string().uuid().nullable(),
  motivo: z.string().nullable(),
  fecha: z.string().datetime(),
  activo: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const sugerenciaRecargoSchema = z.object({
  chequeId: z.string().uuid(),
  clienteId: z.string().uuid(),
  dias: z.number(),
  corresponde: z.boolean(),
  porcentaje: z.number(),
  montoCheque: z.number(),
  montoSugerido: z.number(),
  yaConfirmado: z.boolean(),
});

const confirmarRecargoBodySchema = z.object({
  monto: z.number().positive().optional(),
});

const sugerenciaRechazoSchema = z.object({
  chequeId: z.string().uuid(),
  clienteId: z.string().uuid(),
  montoCheque: z.number(),
  montoARevertir: z.number(),
  porcentajeComision: z.number(),
  comisionSugerida: z.number(),
  yaConfirmado: z.boolean(),
});

const confirmarRechazoBodySchema = z.object({
  comision: z.number().min(0).optional(),
  sinComision: z.boolean().optional(),
});

const confirmarRechazoResponseSchema = z.object({
  cargoComision: cargoSchema.nullable(),
  cargoRechazo: cargoSchema,
  montoRevertido: z.number(),
});

export function registerCobrosOpenApi(): void {
  registry.registerPath({
    method: "post",
    path: "/cobros",
    tags: ["Cobros"],
    summary:
      "Registra un cobro de un cliente (una o más líneas, cada una con su medio de pago) y aplica el " +
      "monto a las boletas pendientes con FIFO (más antigua primero). Las líneas CHEQUE/ECHEQ crean " +
      "automáticamente el cheque correspondiente. Admin o contable.",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      body: { content: { "application/json": { schema: validation.create.body } } },
    },
    responses: {
      201: {
        description: "Cobro creado",
        content: { "application/json": { schema: apiResponseSchema(cobroSchema) } },
      },
      400: { description: "Datos inválidos (cliente inexistente, línea sin datos de cheque, etc.)" },
      403: { description: "No sos admin/contable de la empresa activa" },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/cobros",
    tags: ["Cobros"],
    summary: "Lista los cobros de la empresa activa, filtrable por cliente. Admin o contable.",
    security: [{ bearerAuth: [] }],
    request: { headers: empresaIdHeaderSchema, query: validation.list.query },
    responses: {
      200: {
        description: "OK",
        content: { "application/json": { schema: apiResponseSchema(z.array(cobroSchema)) } },
      },
      403: { description: "No sos admin/contable de la empresa activa" },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/cobros/{id}",
    tags: ["Cobros"],
    summary: "Obtiene un cobro por id. Admin o contable.",
    security: [{ bearerAuth: [] }],
    request: { headers: empresaIdHeaderSchema, params: z.object({ id: z.string().uuid() }) },
    responses: {
      200: {
        description: "OK",
        content: { "application/json": { schema: apiResponseSchema(cobroSchema) } },
      },
      403: { description: "No sos admin/contable de la empresa activa" },
      404: { description: "No existe o no pertenece a la empresa activa" },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/cobros/cheques/{chequeId}/sugerencia-recargo",
    tags: ["Cobros"],
    summary:
      "Calcula (sin guardar nada) si corresponde el recargo del 5% por haberse entregado el cheque a " +
      "más de 7 días de su fecha de cobro. Admin o contable.",
    security: [{ bearerAuth: [] }],
    request: { headers: empresaIdHeaderSchema, params: z.object({ chequeId: z.string().uuid() }) },
    responses: {
      200: {
        description: "OK",
        content: { "application/json": { schema: apiResponseSchema(sugerenciaRecargoSchema) } },
      },
      403: { description: "No sos admin/contable de la empresa activa" },
      404: { description: "Cheque no encontrado" },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/cobros/cheques/{chequeId}/confirmar-recargo",
    tags: ["Cobros"],
    summary: "Confirma (a mano) el recargo del 5% de un cheque y lo carga a la cuenta corriente del cliente. Admin o contable.",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      params: z.object({ chequeId: z.string().uuid() }),
      body: { content: { "application/json": { schema: confirmarRecargoBodySchema } } },
    },
    responses: {
      201: {
        description: "Recargo confirmado",
        content: { "application/json": { schema: apiResponseSchema(cargoSchema) } },
      },
      400: { description: "Monto inválido" },
      403: { description: "No sos admin/contable de la empresa activa" },
      404: { description: "Cheque no encontrado" },
      409: { description: "Ya se había confirmado el recargo de este cheque" },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/cobros/cheques/{chequeId}/sugerencia-rechazo",
    tags: ["Cobros"],
    summary:
      "Calcula (sin guardar nada) cuánto se revertiría de lo aplicado a boletas y la comisión del 7% " +
      "de un cheque marcado RECHAZADO. Admin o contable.",
    security: [{ bearerAuth: [] }],
    request: { headers: empresaIdHeaderSchema, params: z.object({ chequeId: z.string().uuid() }) },
    responses: {
      200: {
        description: "OK",
        content: { "application/json": { schema: apiResponseSchema(sugerenciaRechazoSchema) } },
      },
      400: { description: "El cheque no está rechazado" },
      403: { description: "No sos admin/contable de la empresa activa" },
      404: { description: "Cheque no encontrado" },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/cobros/cheques/{chequeId}/confirmar-rechazo",
    tags: ["Cobros"],
    summary:
      "Confirma (a mano) el rechazo de un cheque: revierte lo aplicado a boletas (orden LIFO), deja una " +
      "línea 'Cheque rechazo Nº: X' visible en la cuenta corriente, y carga la comisión del 7% salvo que " +
      "se mande `sinComision: true` (cliente canceló el cheque el mismo día). Admin o contable.",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      params: z.object({ chequeId: z.string().uuid() }),
      body: { content: { "application/json": { schema: confirmarRechazoBodySchema } } },
    },
    responses: {
      201: {
        description: "Rechazo confirmado",
        content: { "application/json": { schema: apiResponseSchema(confirmarRechazoResponseSchema) } },
      },
      400: { description: "El cheque no está rechazado, o monto inválido" },
      403: { description: "No sos admin/contable de la empresa activa" },
      404: { description: "Cheque no encontrado" },
      409: { description: "Ya se había confirmado el rechazo de este cheque" },
    },
  });
}
