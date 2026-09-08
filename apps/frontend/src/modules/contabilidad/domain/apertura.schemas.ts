import { z } from "zod";

/** Espejo de `SaldoInicialInput`/`generarApertura` en el backend. */
export const saldoInicialSchema = z.object({
  cuentaId: z.string().min(1, "Elegí una cuenta"),
  /** Con signo: positivo = lado natural de la cuenta, negativo = el contrario. */
  importe: z.coerce.number(),
  auxiliarId: z.string().optional().or(z.literal("")),
  detalle: z.string().max(255).optional().or(z.literal("")),
});
export type SaldoInicialFormValues = z.infer<typeof saldoInicialSchema>;

export const aperturaSchema = z.object({
  ejercicioId: z.string().min(1, "Elegí un ejercicio"),
  fecha: z.string().optional().or(z.literal("")),
  descripcion: z.string().max(255).optional().or(z.literal("")),
  cuentaAjusteId: z.string().optional().or(z.literal("")),
  saldos: z.array(saldoInicialSchema).min(1, "Cargá al menos un saldo inicial"),
});
export type AperturaFormValues = z.infer<typeof aperturaSchema>;
