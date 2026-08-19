import { z } from "zod";

import { MedioPago, esMedioPagoCheque } from "@/modules/cobros/domain/cobro.types";

/**
 * Espejo de `CobroValidation.create` en el backend
 * (`apps/backend/src/modules/cobros/infra/http/validation.ts`): los datos
 * del cheque (número, banco, fechas) solo son obligatorios cuando la línea
 * es CHEQUE o ECHEQ — el resto de las reglas las repite el backend igual.
 */
const lineaCobroSchema = z
  .object({
    medioPago: z.nativeEnum(MedioPago, { message: "Elegí un medio de pago" }),
    monto: z.coerce.number().positive("Tiene que ser mayor a 0"),
    numeroCheque: z.string().max(50).optional().or(z.literal("")),
    bancoCheque: z.string().max(100).optional().or(z.literal("")),
    cuitLibradorCheque: z.string().max(20).optional().or(z.literal("")),
    titularCheque: z.string().max(150).optional().or(z.literal("")),
    fechaEmisionCheque: z.string().optional().or(z.literal("")),
    fechaPagoCheque: z.string().optional().or(z.literal("")),
    bancoOBilletera: z.string().max(100).optional().or(z.literal("")),
    remitente: z.string().max(150).optional().or(z.literal("")),
  })
  .refine(
    (data) =>
      !esMedioPagoCheque(data.medioPago) ||
      (data.numeroCheque && data.bancoCheque && data.fechaEmisionCheque && data.fechaPagoCheque),
    {
      message: "Faltan datos del cheque (número, banco, fecha de emisión y fecha de pago)",
      path: ["numeroCheque"],
    },
  );

export const createCobroSchema = z.object({
  clienteId: z.string().uuid("Elegí un cliente"),
  fecha: z.string().min(1, "La fecha es obligatoria"),
  comentarios: z.string().max(255).optional().or(z.literal("")),
  lineas: z.array(lineaCobroSchema).min(1, "Agregá al menos una línea de pago"),
});

export type CreateCobroFormValues = z.infer<typeof createCobroSchema>;
export type LineaCobroFormValues = z.infer<typeof lineaCobroSchema>;
