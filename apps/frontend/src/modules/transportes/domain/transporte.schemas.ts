import { z } from "zod";

import { esCuitValido, esPatenteValida } from "@/modules/transportes/domain/documento-transporte";
import { TipoVehiculo } from "@/modules/transportes/domain/transporte.types";

/**
 * Espejo de `TransporteValidation` en el backend. Los opcionales dejan `""`
 * cuando están vacíos (inputs controlados); la capa `api` los saca antes de
 * mandar el pedido.
 */

const cuit = z
  .string()
  .trim()
  .refine(esCuitValido, "CUIT/CUIL inválido: tienen que ser 11 dígitos con dígito verificador correcto");

const fechaOpcional = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida")
  .optional()
  .or(z.literal(""));

export const transportistaSchema = z.object({
  nombre: z.string().trim().min(1, "Indicá el nombre o la razón social").max(255),
  cuit,
  telefono: z.string().trim().max(30).optional().or(z.literal("")),
  esPropio: z.boolean(),
});
export type TransportistaFormValues = z.infer<typeof transportistaSchema>;

export const choferSchema = z.object({
  transportistaId: z.string().optional().or(z.literal("")),
  nombre: z.string().trim().min(1, "Indicá el nombre").max(100),
  apellido: z.string().trim().min(1, "Indicá el apellido").max(100),
  cuit,
  dni: z.string().trim().max(20).optional().or(z.literal("")),
  telefono: z.string().trim().max(30).optional().or(z.literal("")),
  licenciaVencimiento: fechaOpcional,
});
export type ChoferFormValues = z.infer<typeof choferSchema>;

export const vehiculoSchema = z.object({
  transportistaId: z.string().optional().or(z.literal("")),
  tipo: z.nativeEnum(TipoVehiculo, { message: "Elegí un tipo de vehículo" }),
  patente: z
    .string()
    .trim()
    .refine(esPatenteValida, "Patente inválida: formato ABC123 o AB123CD"),
  descripcion: z.string().trim().max(255).optional().or(z.literal("")),
  rtoVencimiento: fechaOpcional,
  seguroVencimiento: fechaOpcional,
  habilitacionAnimalesVencimiento: fechaOpcional,
});
export type VehiculoFormValues = z.infer<typeof vehiculoSchema>;
