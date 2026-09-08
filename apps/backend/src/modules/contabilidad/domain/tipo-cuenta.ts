/**
 * Tipo de cuenta del plan de cuentas. Define en qué estado contable expone
 * la cuenta y de qué lado está su saldo natural.
 *
 * `ORDEN`: cuentas de orden (garantías otorgadas, cheques endosados) — no
 * integran ni el patrimonio ni el resultado, se muestran aparte.
 */
export enum TipoCuenta {
  ACTIVO = "activo",
  PASIVO = "pasivo",
  PATRIMONIO_NETO = "patrimonio_neto",
  RESULTADO_POSITIVO = "resultado_positivo",
  RESULTADO_NEGATIVO = "resultado_negativo",
  ORDEN = "orden",
}

/**
 * ¿El saldo natural de esta cuenta es deudor (lado del DEBE)?
 *
 * Activo y resultados negativos (gastos) aumentan por el debe; pasivo,
 * patrimonio neto y resultados positivos (ingresos) aumentan por el haber.
 * Se usa para armar el asiento de apertura a partir de saldos iniciales:
 * un importe positivo va al lado natural de la cuenta.
 */
export function tieneSaldoDeudor(tipo: TipoCuenta): boolean {
  return (
    tipo === TipoCuenta.ACTIVO || tipo === TipoCuenta.RESULTADO_NEGATIVO || tipo === TipoCuenta.ORDEN
  );
}

/** ¿La cuenta integra el estado de resultados? (para refundición y cierre, fase 5) */
export function esCuentaDeResultado(tipo: TipoCuenta): boolean {
  return tipo === TipoCuenta.RESULTADO_POSITIVO || tipo === TipoCuenta.RESULTADO_NEGATIVO;
}
