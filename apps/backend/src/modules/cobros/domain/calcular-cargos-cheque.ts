/** Porcentaje del recargo cuando un cheque se entrega a más de 7 días de la fecha de cobro. */
export const PORCENTAJE_RECARGO_CHEQUE = 0.05;

/** A partir de cuántos días de diferencia corresponde el recargo (exclusivo: 7 días exactos NO llevan recargo). */
export const DIAS_PLAZO_SIN_RECARGO_CHEQUE = 7;

/** Porcentaje de la comisión cuando un cheque se marca `RECHAZADO`. */
export const PORCENTAJE_COMISION_RECHAZO = 0.07;

function redondear(valor: number): number {
  return Math.round(valor * 100) / 100;
}

/** Días corridos entre la fecha del cobro (cuando el cliente entrega el cheque) y la fecha de pago del cheque. */
export function calcularDiasPlazoCheque(fechaCobro: Date, fechaPagoCheque: Date): number {
  return Math.round((fechaPagoCheque.getTime() - fechaCobro.getTime()) / (24 * 60 * 60 * 1000));
}

export function correspondeRecargoCheque(dias: number): boolean {
  return dias > DIAS_PLAZO_SIN_RECARGO_CHEQUE;
}

export function calcularMontoRecargoCheque(montoCheque: number): number {
  return redondear(montoCheque * PORCENTAJE_RECARGO_CHEQUE);
}

export function calcularMontoComisionRechazo(montoCheque: number): number {
  return redondear(montoCheque * PORCENTAJE_COMISION_RECHAZO);
}
