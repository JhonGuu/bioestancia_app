/**
 * Espejo de `apps/backend/src/modules/contabilidad/domain/tipo-cuenta.ts`.
 * Objeto `as const` en vez de `enum` (el tsconfig tiene `erasableSyntaxOnly`,
 * ver comentario en `auth.types.ts`).
 */
export const TipoCuenta = {
  ACTIVO: "activo",
  PASIVO: "pasivo",
  PATRIMONIO_NETO: "patrimonio_neto",
  RESULTADO_POSITIVO: "resultado_positivo",
  RESULTADO_NEGATIVO: "resultado_negativo",
  ORDEN: "orden",
} as const;
export type TipoCuenta = (typeof TipoCuenta)[keyof typeof TipoCuenta];

export const TIPO_CUENTA_LABELS: Record<TipoCuenta, string> = {
  [TipoCuenta.ACTIVO]: "Activo",
  [TipoCuenta.PASIVO]: "Pasivo",
  [TipoCuenta.PATRIMONIO_NETO]: "Patrimonio neto",
  [TipoCuenta.RESULTADO_POSITIVO]: "Resultado positivo (ingreso)",
  [TipoCuenta.RESULTADO_NEGATIVO]: "Resultado negativo (gasto)",
  [TipoCuenta.ORDEN]: "Cuenta de orden",
};

/** ¿El saldo natural de esta cuenta es deudor (lado del debe)? Mismo criterio que el backend. */
export function tieneSaldoDeudor(tipo: TipoCuenta): boolean {
  return tipo === TipoCuenta.ACTIVO || tipo === TipoCuenta.RESULTADO_NEGATIVO || tipo === TipoCuenta.ORDEN;
}
